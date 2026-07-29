const Customer = require('../models/customer');
const Payment = require('../models/payment');
const Route = require('../models/routes');
const Service = require('../models/service');
const Staff = require('../models/staff');

// ==================== MANAGER DASHBOARD ANALYTICS ====================

const getDashboardMetrics = async (req, res) => {
  try {
    const companyId = req.user.companyId;
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
            companyId: companyId,
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
      Customer.countDocuments({ companyId: companyId, status: 'active' }),

      // 3. Route Completion Rate (from Routes)
      Route.aggregate([
        {
          $match: {
            companyId: companyId,
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
          $match: { companyId: companyId, status: 'active' }
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
        companyId: companyId,
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
    const companyId = req.user.companyId;
    const liveOperations = await Route.find({
      companyId: companyId,
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
          companyId: companyId,
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
            $match: {
              companyId: companyId
            }
          },
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
    const companyId = req.user.companyId;
    const [
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      residentialCount,
      commercialCount,
      institutionalCount
    ] = await Promise.all([
      Customer.countDocuments({ companyId: companyId }),
      Customer.countDocuments({ companyId: companyId, status: 'active' }),
      Customer.countDocuments({ companyId: companyId, status: 'non-active' }),
      Customer.countDocuments({ companyId: companyId, customer_type: 'residential' }),
      Customer.countDocuments({ companyId: companyId, customer_type: 'commercial' }),
      Customer.countDocuments({ companyId: companyId, customer_type: 'institutional' })
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
    const companyId = req.user.companyId;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueTrend = await Payment.aggregate([
      {
        $match: {
          companyId: companyId,
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
    const companyId = req.user.companyId;
    const agentPerformance = await Payment.aggregate([
      {
        $match: {
          companyId: companyId,
          payment_status: 'paid'
        }
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
    const companyId = req.user.companyId;
    const currentMonth = new Date();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    const routeStats = await Route.aggregate([
      {
        $match: {
          companyId: companyId,
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
    const companyId = req.user.companyId;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const customers = await Customer.aggregate([
      {
        $match: {
          companyId: companyId,
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



const getReportsSummary = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Date boundaries for current month and last 6 months
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Run all aggregations in parallel
    const [
      // Revenue overview (all-time)
      revenueOverview,
      // Monthly revenue (current month)
      monthlyRevenue,
      // Revenue trend (last 6 months)
      revenueTrend,
      // Revenue by street
      revenueByStreet,
      // Revenue by customer type
      revenueByType,
      // Payment status counts
      paidCount,
      pendingCount,
      overdueCustomers,
      // Collection rate: expected from customer fees
      expectedRevenue,
      // Collection rate: collected from payments
      collectedRevenue,
      // Agent performance
      agentPerformance,
      // Outstanding balances
      outstandingBalances,
    ] = await Promise.all([
      // 1. Revenue overview (all-time paid payments)
      Payment.aggregate([
        { $match: { companyId, payment_status: 'paid' } },
        {
          $group: {
            _id: null,
            total_revenue: { $sum: '$amount' },
            cash_revenue: { $sum: { $cond: [{ $eq: ['$payment_method', 'cash'] }, '$amount', 0] } },
            transfer_revenue: { $sum: { $cond: [{ $eq: ['$payment_method', 'transfer'] }, '$amount', 0] } },
          },
        },
      ]),

      // 2. Monthly revenue (current month)
      Payment.aggregate([
        {
          $match: {
            companyId,
            payment_status: 'paid',
            payment_date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        { $group: { _id: null, monthly_revenue: { $sum: '$amount' } } },
      ]),

      // 3. Revenue trend (last 6 months)
      Payment.aggregate([
        {
          $match: {
            companyId,
            payment_status: 'paid',
            payment_date: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$payment_date' },
              month: { $month: '$payment_date' },
            },
            revenue: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
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
                    { $toString: '$_id.month' },
                  ],
                },
              ],
            },
            revenue: 1,
          },
        },
      ]),

      // 4. Revenue by street
      Payment.aggregate([
        { $match: { companyId, payment_status: 'paid' } },
        { $lookup: { from: 'customers', localField: 'customer_id', foreignField: '_id', as: 'customer' } },
        { $unwind: '$customer' },
        { $lookup: { from: 'streets', localField: 'customer.street', foreignField: '_id', as: 'street' } },
        { $unwind: '$street' },
        {
          $group: {
            _id: '$street._id',
            street_name: { $first: '$street.name' },
            total_revenue: { $sum: '$amount' },
            payment_count: { $sum: 1 },
          },
        },
        { $sort: { total_revenue: -1 } },
        { $project: { _id: 0, street_name: 1, total_revenue: 1, payment_count: 1 } },
      ]),

      // 5. Revenue by customer type
      Payment.aggregate([
        { $match: { companyId, payment_status: 'paid' } },
        { $lookup: { from: 'customers', localField: 'customer_id', foreignField: '_id', as: 'customer' } },
        { $unwind: '$customer' },
        {
          $group: {
            _id: '$customer.customer_type',
            total_revenue: { $sum: '$amount' },
          },
        },
        { $project: { _id: 0, customer_type: '$_id', total_revenue: 1 } },
      ]),

      // 6. Paid payments count
      Payment.countDocuments({ companyId, payment_status: 'paid' }),

      // 7. Pending payments count
      Payment.countDocuments({ companyId, payment_status: 'pending' }),

      // 8. Overdue customers count
      Customer.countDocuments({
        companyId,
        'monthly_fees.remaining_balance': { $gt: 0 },
      }),

      // 9. Expected revenue for current month (sum of total_fee for current month)
      Customer.aggregate([
        { $match: { companyId } },
        { $unwind: '$monthly_fees' },
        {
          $match: {
            'monthly_fees.month': { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        { $group: { _id: null, expected_revenue: { $sum: '$monthly_fees.total_fee' } } },
      ]),

      // 10. Collected revenue for current month
      Payment.aggregate([
        {
          $match: {
            companyId,
            payment_status: 'paid',
            payment_date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        { $group: { _id: null, collected_revenue: { $sum: '$amount' } } },
      ]),

      // 11. Agent performance (same as existing getAgentPerformance)
      Payment.aggregate([
        { $match: { companyId, payment_status: 'paid' } },
        {
          $group: {
            _id: '$agent_id',
            total_collections: { $sum: '$amount' },
            payment_count: { $sum: 1 },
            cash_payments: { $sum: { $cond: [{ $eq: ['$payment_method', 'cash'] }, 1, 0] } },
            transfer_payments: { $sum: { $cond: [{ $eq: ['$payment_method', 'transfer'] }, 1, 0] } },
          },
        },
        { $lookup: { from: 'staffs', localField: '_id', foreignField: '_id', as: 'agent' } },
        { $unwind: '$agent' },
        {
          $project: {
            _id: 0,
            agent_name: '$agent.full_name',
            total_collections: 1,
            payment_count: 1,
            cash_payments: 1,
            transfer_payments: 1,
          },
        },
        { $sort: { total_collections: -1 } },
      ]),

      // 12. Outstanding balances (total sum and distinct customer count)
      Customer.aggregate([
        { $match: { companyId } },
        { $unwind: '$monthly_fees' },
        { $match: { 'monthly_fees.remaining_balance': { $gt: 0 } } },
        {
          $group: {
            _id: null,
            total_outstanding: { $sum: '$monthly_fees.remaining_balance' },
            customers_with_balance: { $addToSet: '$_id' },
          },
        },
        {
          $project: {
            _id: 0,
            total_outstanding: 1,
            customers_with_balance: { $size: '$customers_with_balance' },
          },
        },
      ]),
    ]);

    // Build the final response object with defaults for missing data
    const responseData = {
      revenueOverview: {
        total_revenue: revenueOverview[0]?.total_revenue || 0,
        monthly_revenue: monthlyRevenue[0]?.monthly_revenue || 0,
        cash_revenue: revenueOverview[0]?.cash_revenue || 0,
        transfer_revenue: revenueOverview[0]?.transfer_revenue || 0,
      },
      revenueTrend: revenueTrend || [],
      revenueByStreet: revenueByStreet || [],
      revenueByType: revenueByType || [],
      paymentStatus: [
        { status: 'paid', count: paidCount },
        { status: 'pending', count: pendingCount },
        { status: 'overdue', count: overdueCustomers },
      ],
      collectionRate: {
        expected_revenue: expectedRevenue[0]?.expected_revenue || 0,
        collected_revenue: collectedRevenue[0]?.collected_revenue || 0,
        collection_rate:
          expectedRevenue[0]?.expected_revenue && expectedRevenue[0].expected_revenue > 0
            ? (collectedRevenue[0]?.collected_revenue / expectedRevenue[0].expected_revenue) * 100
            : 0,
      },
      agentPerformance: agentPerformance || [],
      outstandingBalances: outstandingBalances[0] || { total_outstanding: 0, customers_with_balance: 0 },
    };

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error in getReportsSummary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== EXPORTS ====================

module.exports = {
  getDashboardMetrics,
  getLiveOperations,
  getRouteAnalytics,
  getReportsSummary,
  getCustomerOverview,
  getRevenueTrend,
  getAgentPerformance,
  getCustomerGrowth,


};