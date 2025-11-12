const Customer = require('../models/customer');
const Payment = require('../models/payment');
const Route = require('../models/routes');
const Service = require('../models/service');
const Staff = require('../models/staff');

// ==================== MANAGER DASHBOARD ANALYTICS ====================

const getDashboardMetrics = async (req, res) => {
  try {
    // Get current month dates
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    // Run all analytics in parallel for performance
    const [
      monthlyRevenue,
      activeCustomers,
      routeStats,
      unpaidBalance,
      activeRoutesCount
    ] = await Promise.all([
      // 1. Monthly Revenue (from Payments)
      Payment.aggregate([
        {
          $match: {
            payment_status: 'paid',
            payment_date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),

      // 2. Active Customers Count
      Customer.countDocuments({ status: 'active' }),

      // 3. Route Completion Rate (from Routes)
      Route.aggregate([
        {
          $match: {
            scheduled_date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            totalRoutes: { $sum: 1 },
            completedRoutes: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            }
          }
        }
      ]),

      Customer.aggregate([
        {
          $match: { status: 'active' }
        },
        {
          $unwind: { path: '$monthly_fees', preserveNullAndEmptyArrays: true }
        },
        {
          $match: {
            'monthly_fees.month': {
              $gte: firstDayOfMonth,
              $lte: lastDayOfMonth
            }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$monthly_fees.remaining_balance' }
          }
        }
      ]),

      // 5. Active Routes Count
      Route.countDocuments({
        status: { $in: ['in_progress', 'paused', 'at_dumpsite'] }
      })
    ]);

    // Calculate route completion percentage
    const totalRoutes = routeStats[0]?.totalRoutes || 0;
    const completedRoutes = routeStats[0]?.completedRoutes || 0;
    const routeCompletion = totalRoutes > 0 ?
      Math.round((completedRoutes / totalRoutes) * 100) : 0;

    // For now, use mock changes (you can calculate these later from historical data)
    const revenueChange = '+12%';
    const customerChange = '+5%';
    const completionChange = '+8%';
    const balanceChange = '-3%';

    res.json({
      success: true,
      data: {
        monthlyRevenue: `₦${(monthlyRevenue[0]?.total || 0).toLocaleString()}`,
        activeCustomers: activeCustomers,
        routeCompletion: `${routeCompletion}%`,
        unpaidBalance: `₦${(unpaidBalance[0]?.total || 0).toLocaleString()}`,
        revenueChange,
        customerChange,
        completionChange,
        balanceChange,
        activeRoutes: activeRoutesCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLiveOperations = async (req, res) => {
  try {
    const liveOperations = await Route.find({
      status: { $in: ['in_progress', 'paused', 'at_dumpsite', 'scheduled'] }
    })
      .populate('assigned_truck')
      .populate('supervisor')
      .populate('streets')
      .populate('assigned_team')
      .sort({ 'assignment_lifecycle.started_at': -1 });

    // Transform data for frontend
    const transformedOperations = await Promise.all(
      liveOperations.map(async (route) => {
        // Calculate completed services for this route
        const completedServices = await Service.countDocuments({
          route: route._id,
          service_status: 'serviced'
        });

        const totalStreets = route.streets?.length || 0;
        const progress = totalStreets > 0 ?
          `${Math.round((completedServices / totalStreets) * 100)}% Complete` : '0% Complete';

        // Calculate time info
        let timeInfo = '';
        if (route.assignment_lifecycle?.started_at) {
          const startTime = new Date(route.assignment_lifecycle.started_at);
          const now = new Date();
          const diffHours = Math.floor((now - startTime) / (1000 * 60 * 60));
          const diffMinutes = Math.floor(((now - startTime) % (1000 * 60 * 60)) / (1000 * 60));
          timeInfo = `Running: ${diffHours}h ${diffMinutes}m`;
        } else {
          timeInfo = `Starts: ${new Date(route.scheduled_date).toLocaleTimeString()}`;
        }

        // Calculate collections for this route
        const routeCollections = await Payment.aggregate([
          {
            $lookup: {
              from: 'services',
              localField: 'service_id',
              foreignField: '_id',
              as: 'service'
            }
          },
          {
            $unwind: '$service'
          },
          {
            $match: {
              'service.route': route._id,
              payment_status: 'paid'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        const collections = routeCollections[0]?.total || 0;

        return {
          id: route._id.toString(),
          title: `Truck ${route.assigned_truck?.plate_number || 'Unknown'}`,
          supervisor: route.supervisor?.full_name,
          status: route.status,
          progress,
          time: timeInfo,
          location: route.assignment_lifecycle?.current_location ? 'Live Tracking' : 'No Location',
          collection: `Collections: ₦${collections.toLocaleString()}`,
          truck: {
            plate_number: route.assigned_truck?.plate_number,
            truckModel: route.assigned_truck?.truckModel,
            truckCapacity: route.assigned_truck?.truckCapacity
          },
          assignment_lifecycle: route.assignment_lifecycle,
          streets: route.streets?.map(street => street.name) || [],
          completed_services: completedServices
        };
      })
    );

    res.json({
      success: true,
      data: transformedOperations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== ESSENTIAL EXISTING FUNCTIONS (KEPT) ====================

const getCustomerOverview = async (req, res) => {
  try {
    const [
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      residentialCount,
      commercialCount,
      institutionalCount
    ] = await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments({ status: 'active' }),
      Customer.countDocuments({ status: 'non-active' }),
      Customer.countDocuments({ customer_type: 'residential' }),
      Customer.countDocuments({ customer_type: 'commercial' }),
      Customer.countDocuments({ customer_type: 'institutional' })
    ]);

    res.json({
      success: true,
      data: {
        total_customers: totalCustomers,
        active_customers: activeCustomers,
        inactive_customers: inactiveCustomers,
        residential_customers: residentialCount,
        commercial_customers: commercialCount,
        institutional_customers: institutionalCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRevenueTrend = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueTrend = await Payment.aggregate([
      {
        $match: {
          payment_status: 'paid',
          payment_date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$payment_date' },
            month: { $month: '$payment_date' }
          },
          revenue: { $sum: '$amount' },
          payment_count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' }
                ]
              }
            ]
          },
          revenue: 1,
          payment_count: 1
        }
      }
    ]);

    res.json({ success: true, data: revenueTrend });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAgentPerformance = async (req, res) => {
  try {
    const agentPerformance = await Payment.aggregate([
      {
        $match: { payment_status: 'paid' }
      },
      {
        $group: {
          _id: '$agent_id',
          total_collections: { $sum: '$amount' },
          payment_count: { $sum: 1 },
          cash_payments: {
            $sum: { $cond: [{ $eq: ['$payment_method', 'cash'] }, 1, 0] }
          },
          transfer_payments: {
            $sum: { $cond: [{ $eq: ['$payment_method', 'transfer'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'staffs',
          localField: '_id',
          foreignField: '_id',
          as: 'agent_info'
        }
      },
      {
        $unwind: '$agent_info'
      },
      {
        $project: {
          _id: 0,
          agent_id: '$_id',
          agent_name: '$agent_info.full_name',
          total_collections: 1,
          payment_count: 1,
          cash_payments: 1,
          transfer_payments: 1
        }
      },
      {
        $sort: { total_collections: -1 }
      }
    ]);

    res.json({ success: true, data: agentPerformance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRouteAnalytics = async (req, res) => {
  try {
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    const routeStats = await Route.aggregate([
      {
        $match: {
          scheduled_date: { $gte: firstDayOfMonth }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total_duration: {
            $sum: {
              $cond: [
                {
                  $and: [
                    '$assignment_lifecycle.started_at',
                    '$assignment_lifecycle.completed_at'
                  ]
                },
                {
                  $subtract: [
                    '$assignment_lifecycle.completed_at',
                    '$assignment_lifecycle.started_at'
                  ]
                },
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: routeStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== SIMPLIFIED CUSTOMER ANALYTICS ====================

const getCustomerGrowth = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const customers = await Customer.aggregate([
      {
        $match: {
          created_at: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$created_at' },
            month: { $month: '$created_at' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' }
                ]
              }
            ]
          },
          count: 1
        }
      }
    ]);

    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== EXPORTS ====================

module.exports = {
  getDashboardMetrics,
  getLiveOperations,
  getRouteAnalytics,

  getCustomerOverview,
  getRevenueTrend,
  getAgentPerformance,
  getCustomerGrowth,


};