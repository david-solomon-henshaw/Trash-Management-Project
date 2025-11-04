const Customer = require('../models/customer');
const Payment = require('../models/payment');
const ApartmentType = require('../models/apartment');
const CommercialSubtype = require('../models/commercial');
const Street = require('../models/street');

// ==================== CUSTOMER ANALYTICS ====================

const getCustomerOverview = async (req, res) => {
  try {
    const [
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      residentialCount,
      commercialCount
    ] = await Promise.all([
      Customer.countDocuments(),
      Customer.countDocuments({ status: 'active' }),
      Customer.countDocuments({ status: 'non-active' }),
      Customer.countDocuments({ customer_type: 'residential' }),
      Customer.countDocuments({ customer_type: 'commercial' })
    ]);

    res.json({
      success: true,
      data: {
        total_customers: totalCustomers,
        active_customers: activeCustomers,
        inactive_customers: inactiveCustomers,
        residential_customers: residentialCount,
        commercial_customers: commercialCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

const getCustomersByStreet = async (req, res) => {
  try {
    const customersByStreet = await Customer.aggregate([
      {
        $group: {
          _id: '$street',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'streets',
          localField: '_id',
          foreignField: '_id',
          as: 'street_info'
        }
      },
      {
        $unwind: '$street_info'
      },
      {
        $project: {
          _id: 0,
          street_id: '$_id',
          street_name: '$street_info.name',
          customer_count: '$count'
        }
      },
      {
        $sort: { customer_count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({ success: true, data: customersByStreet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCustomersByApartmentType = async (req, res) => {
  try {
    const apartmentDistribution = await Customer.aggregate([
      {
        $match: { customer_type: 'residential' }
      },
      {
        $group: {
          _id: '$apartment_type',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'apartmenttypes',
          localField: '_id',
          foreignField: '_id',
          as: 'type_info'
        }
      },
      {
        $unwind: '$type_info'
      },
      {
        $project: {
          _id: 0,
          type_name: '$type_info.name',
          customer_count: '$count'
        }
      },
      {
        $sort: { customer_count: -1 }
      }
    ]);

    res.json({ success: true, data: apartmentDistribution });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCustomersByBusinessType = async (req, res) => {
  try {
    const businessDistribution = await Customer.aggregate([
      {
        $match: { customer_type: 'commercial' }
      },
      {
        $group: {
          _id: '$commercial_subtype',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'commercialsubtypes',
          localField: '_id',
          foreignField: '_id',
          as: 'type_info'
        }
      },
      {
        $unwind: '$type_info'
      },
      {
        $project: {
          _id: 0,
          type_name: '$type_info.name',
          customer_count: '$count'
        }
      },
      {
        $sort: { customer_count: -1 }
      }
    ]);

    res.json({ success: true, data: businessDistribution });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== FINANCIAL REPORTS ====================

const getRevenueOverview = async (req, res) => {
  try {
    const [
      totalRevenue,
      monthlyRevenue,
      cashRevenue,
      transferRevenue,
      pendingAmount
    ] = await Promise.all([
      Payment.aggregate([
        { $match: { payment_status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        {
          $match: {
            payment_status: 'paid',
            payment_date: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { payment_status: 'paid', payment_method: 'cash' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { payment_status: 'paid', payment_method: 'transfer' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        { $match: { payment_status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total_revenue: totalRevenue[0]?.total || 0,
        monthly_revenue: monthlyRevenue[0]?.total || 0,
        cash_revenue: cashRevenue[0]?.total || 0,
        transfer_revenue: transferRevenue[0]?.total || 0,
        pending_amount: pendingAmount[0]?.total || 0
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

const getRevenueByStreet = async (req, res) => {
  try {
    const revenueByStreet = await Payment.aggregate([
      {
        $match: { payment_status: 'paid' }
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: '$customer'
      },
      {
        $group: {
          _id: '$customer.street',
          total_revenue: { $sum: '$amount' },
          payment_count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'streets',
          localField: '_id',
          foreignField: '_id',
          as: 'street_info'
        }
      },
      {
        $unwind: '$street_info'
      },
      {
        $project: {
          _id: 0,
          street_name: '$street_info.name',
          total_revenue: 1,
          payment_count: 1
        }
      },
      {
        $sort: { total_revenue: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({ success: true, data: revenueByStreet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRevenueByCustomerType = async (req, res) => {
  try {
    const revenueByType = await Payment.aggregate([
      {
        $match: { payment_status: 'paid' }
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: '$customer'
      },
      {
        $group: {
          _id: '$customer.customer_type',
          total_revenue: { $sum: '$amount' },
          payment_count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          customer_type: '$_id',
          total_revenue: 1,
          payment_count: 1
        }
      }
    ]);

    res.json({ success: true, data: revenueByType });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const statusDistribution = await Payment.aggregate([
      {
        $group: {
          _id: '$payment_status',
          count: { $sum: 1 },
          total_amount: { $sum: '$amount' }
        }
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
          total_amount: 1
        }
      }
    ]);

    res.json({ success: true, data: statusDistribution });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCollectionRate = async (req, res) => {
  try {
    const customers = await Customer.find({ status: 'active' })
      .populate('apartment_type')
      .populate('commercial_subtype');

    const expectedRevenue = customers.reduce((sum, customer) => {
      const baseFee = customer.customer_type === 'residential'
        ? customer.apartment_type?.base_fee || 0
        : customer.commercial_subtype?.base_fee || 0;
      return sum + baseFee;
    }, 0);

    const currentMonth = new Date();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    const collectedRevenue = await Payment.aggregate([
      {
        $match: {
          payment_status: 'paid',
          payment_date: { $gte: firstDay }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const collected = collectedRevenue[0]?.total || 0;
    const collectionRate = expectedRevenue > 0 
      ? ((collected / expectedRevenue) * 100).toFixed(2) 
      : 0;

    res.json({
      success: true,
      data: {
        expected_revenue: expectedRevenue,
        collected_revenue: collected,
        collection_rate: parseFloat(collectionRate),
        outstanding: expectedRevenue - collected
      }
    });
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

const getOutstandingBalances = async (req, res) => {
  try {
    const customers = await Customer.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $unwind: { path: '$monthly_fees', preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: null,
          total_outstanding: { $sum: '$monthly_fees.remaining_balance' },
          customers_with_balance: {
            $sum: {
              $cond: [{ $gt: ['$monthly_fees.remaining_balance', 0] }, 1, 0]
            }
          }
        }
      }
    ]);

    const result = customers[0] || { total_outstanding: 0, customers_with_balance: 0 };

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = {
    getCustomerGrowth,
    getCustomersByStreet,
    getCustomersByApartmentType,
    getCustomersByBusinessType,
    getCustomerOverview,
    getOutstandingBalances,
    getAgentPerformance,
    getCollectionRate,
    getPaymentStatus,
    getRevenueByCustomerType,
    getRevenueByStreet,
    getRevenueTrend,
    getRevenueOverview



}