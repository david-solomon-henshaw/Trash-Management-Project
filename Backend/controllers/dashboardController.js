// controllers/dashboardController.js
const Customer = require('../models/customer');
const Payment = require('../models/payment');
const Route = require('../models/truck_routes');
const Truck = require('../models/trucks');
const Staff = require('../models/staff');
const Street = require('../models/street');

// ==================== DASHBOARD DATA AGGREGATION ====================

const getDashboardData = async (req, res) => {
  try {
    const [metrics, liveOperations] = await Promise.all([
      getPerformanceMetrics(),
      getLiveOperations()
    ]);

    res.json({
      success: true,
      data: {
        metrics,
        liveOperations,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== PERFORMANCE METRICS ====================

const getPerformanceMetrics = async () => {
  const currentDate = new Date();
  const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

  const [
    monthlyRevenueData,
    previousMonthRevenueData,
    activeCustomers,
    previousMonthActiveCustomers,
    routeCompletionData,
    previousMonthRouteCompletion,
    unpaidBalanceData,
    previousMonthUnpaidBalance
  ] = await Promise.all([
    // Current month revenue
    Payment.aggregate([
      {
        $match: {
          payment_status: 'paid',
          payment_date: { $gte: currentMonthStart }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]),
    // Previous month revenue
    Payment.aggregate([
      {
        $match: {
          payment_status: 'paid',
          payment_date: { 
            $gte: previousMonthStart,
            $lte: previousMonthEnd
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]),
    // Active customers count
    Customer.countDocuments({ status: 'active' }),
    // Previous month active customers (customers created before previous month end)
    Customer.countDocuments({ 
      status: 'active',
      created_at: { $lte: previousMonthEnd }
    }),
    // Route completion rate
    Route.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),
    // Previous month route completion (routes scheduled in previous month)
    Route.aggregate([
      {
        $match: {
          scheduled_date: { 
            $gte: previousMonthStart,
            $lte: previousMonthEnd
          }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),
    // Unpaid balance
    Customer.aggregate([
      { $unwind: '$monthly_fees' },
      {
        $group: {
          _id: null,
          totalUnpaid: { $sum: '$monthly_fees.remaining_balance' }
        }
      }
    ]),
    // Previous month unpaid balance (simplified - using current data structure)
    Customer.aggregate([
      { $unwind: '$monthly_fees' },
      {
        $match: {
          'monthly_fees.month': { 
            $lt: currentMonthStart,
            $gte: previousMonthStart
          }
        }
      },
      {
        $group: {
          _id: null,
          totalUnpaid: { $sum: '$monthly_fees.remaining_balance' }
        }
      }
    ])
  ]);

  // Calculate metrics
  const monthlyRevenue = monthlyRevenueData[0]?.total || 0;
  const previousMonthRevenue = previousMonthRevenueData[0]?.total || 0;
  const revenueChange = previousMonthRevenue > 0 
    ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1)
    : monthlyRevenue > 0 ? 100 : 0;

  const customerChange = previousMonthActiveCustomers > 0
    ? ((activeCustomers - previousMonthActiveCustomers) / previousMonthActiveCustomers * 100).toFixed(1)
    : activeCustomers > 0 ? 100 : 0;

  // Route completion calculation
  const currentCompleted = routeCompletionData.find(r => r._id === 'completed')?.count || 0;
  const currentTotal = routeCompletionData.reduce((sum, r) => sum + r.count, 0);
  const routeCompletion = currentTotal > 0 ? (currentCompleted / currentTotal * 100).toFixed(1) : 0;

  const previousCompleted = previousMonthRouteCompletion.find(r => r._id === 'completed')?.count || 0;
  const previousTotal = previousMonthRouteCompletion.reduce((sum, r) => sum + r.count, 0);
  const previousCompletion = previousTotal > 0 ? (previousCompleted / previousTotal * 100).toFixed(1) : 0;
  const completionChange = previousCompletion > 0
    ? (parseFloat(routeCompletion) - parseFloat(previousCompletion)).toFixed(1)
    : routeCompletion > 0 ? 100 : 0;

  // Unpaid balance calculation
  const unpaidBalance = unpaidBalanceData[0]?.totalUnpaid || 0;
  const previousUnpaidBalance = previousMonthUnpaidBalance[0]?.totalUnpaid || 0;
  const balanceChange = previousUnpaidBalance > 0
    ? ((unpaidBalance - previousUnpaidBalance) / previousUnpaidBalance * 100).toFixed(1)
    : unpaidBalance > 0 ? 100 : 0;

  return {
    monthlyRevenue: formatCurrency(monthlyRevenue),
    activeCustomers: activeCustomers,
    routeCompletion: `${routeCompletion}%`,
    unpaidBalance: formatCurrency(unpaidBalance),
    revenueChange: `${revenueChange >= 0 ? '+' : ''}${revenueChange}%`,
    customerChange: `${customerChange >= 0 ? '+' : ''}${customerChange}%`,
    completionChange: `${completionChange >= 0 ? '+' : ''}${completionChange}%`,
    balanceChange: `${balanceChange >= 0 ? '+' : ''}${balanceChange}%`
  };
};

// ==================== LIVE OPERATIONS ====================

const getLiveOperations = async () => {
  const [routes, trucks] = await Promise.all([
    Route.find()
      .populate('assigned_truck', 'plate_number truckModel truckStatus')
      .populate('supervisor', 'full_name')
      .populate('streets', 'name')
      .populate({
        path: 'assigned_team',
        populate: {
          path: 'team_members.user',
          select: 'full_name role'
        }
      })
      .sort({ scheduled_date: -1 })
      .limit(10),
    
    Truck.find({ 
      truckStatus: { $in: ['operational', 'maintenance', 'inactive'] } 
    })
      .populate('assignment_history.route')
      .populate('assignment_history.team')
  ]);

  const operations = [];

  // Process active routes
  for (const route of routes) {
    if (route.status === 'in_progress' || route.status === 'scheduled') {
      const truck = route.assigned_truck;
      const supervisor = route.supervisor;
      const streets = route.streets || [];
      
      // Calculate progress (mock data - you can enhance this with real progress tracking)
      const progress = Math.floor(Math.random() * 100); // Replace with actual progress calculation
      
      // Calculate time on duty
      const timeOnDuty = calculateTimeOnDuty(route.scheduled_date);
      
      // Calculate collections (mock data - replace with actual payment aggregation)
      const collectionAmount = await calculateRouteCollections(route._id);
      
      operations.push({
        id: route._id.toString(),
        title: `${truck?.truckModel || 'Truck'} - ${truck?.plate_number || 'N/A'}`,
        status: mapRouteStatus(route.status),
        statusColor: getStatusColor(route.status),
        supervisor: supervisor?.full_name || 'Unassigned',
        location: streets.map(s => s.name).join(', ') || 'No location',
        progress: `${progress}% completed`,
        time: timeOnDuty,
        collection: collectionAmount > 0 ? `₦${formatNumber(collectionAmount)} collected` : null,
        icon: 'car-sport',
        routeId: route._id,
        truckId: truck?._id,
        scheduled_date: route.scheduled_date
      });
    }
  }

  // Process trucks without active routes
  for (const truck of trucks) {
    const hasActiveRoute = routes.some(route => 
      route.assigned_truck?._id.toString() === truck._id.toString() && 
      ['scheduled', 'in_progress'].includes(route.status)
    );

    if (!hasActiveRoute) {
      let operation = {
        id: truck._id.toString(),
        title: `${truck.truckModel} - ${truck.plate_number}`,
        status: mapTruckStatus(truck.truckStatus),
        statusColor: getStatusColor(truck.truckStatus),
        icon: getTruckIcon(truck.truckStatus)
      };

      if (truck.truckStatus === 'maintenance') {
        operation = {
          ...operation,
          supervisor: 'Maintenance Team',
          issue: 'Regular maintenance',
          expected: `Expected: ${formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}`,
          cost: 'Cost: ₦0' // You can add actual maintenance cost data
        };
      } else if (truck.truckStatus === 'inactive') {
        operation = {
          ...operation,
          location: 'Depot',
          note: 'No assignment'
        };
      }

      operations.push(operation);
    }
  }

  return operations.slice(0, 8); // Return top 8 operations
};

// ==================== HELPER FUNCTIONS ====================

const formatCurrency = (amount) => {
  if (amount >= 1000000) {
    return `₦${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `₦${(amount / 1000).toFixed(0)}k`;
  }
  return `₦${amount}`;
};

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num);
};

const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
};

const calculateTimeOnDuty = (scheduledDate) => {
  const now = new Date();
  const scheduled = new Date(scheduledDate);
  const diffMs = now - scheduled;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `On duty ${diffHours}h ${diffMinutes}m`;
  }
  return `On duty ${diffMinutes}m`;
};

const calculateRouteCollections = async (routeId) => {
  // This would aggregate payments from customers on the route's streets
  // For now, return mock data
  return Math.random() * 50000;
};

const mapRouteStatus = (status) => {
  const statusMap = {
    'scheduled': 'Scheduled',
    'in_progress': 'Active',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  return statusMap[status] || 'Unknown';
};

const mapTruckStatus = (status) => {
  const statusMap = {
    'operational': 'Active',
    'maintenance': 'Maintenance',
    'inactive': 'Idle'
  };
  return statusMap[status] || 'Unknown';
};

const getStatusColor = (status) => {
  const colorMap = {
    'in_progress': '#10b981',
    'operational': '#10b981',
    'scheduled': '#f59e0b',
    'maintenance': '#f59e0b',
    'completed': '#6366f1',
    'inactive': '#64748b',
    'cancelled': '#ef4444'
  };
  return colorMap[status] || '#64748b';
};

const getTruckIcon = (status) => {
  const iconMap = {
    'operational': 'car-sport',
    'maintenance': 'build',
    'inactive': 'time'
  };
  return iconMap[status] || 'car-sport';
};

// ==================== EXPORTS ====================

module.exports = {
  getDashboardData,
  getPerformanceMetrics,
  getLiveOperations
};