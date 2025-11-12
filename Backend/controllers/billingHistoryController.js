const Customer = require('../models/customer');
const Payment = require('../models/payment');
const mongoose = require('mongoose');

// Search customers by name, phone, or address
const searchCustomers = async (req, res) => {
  try {
    const { query } = req.query;

    if (query === undefined || query === null) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query parameter is required' 
      });
    }

    let customers;
    
    if (query.trim() === '') {
      // If query is empty string, return all customers
      customers = await Customer.find()
        .populate('street', 'name')
        .populate('apartment_type', 'name base_fee')
        .populate('commercial_subtype', 'name base_fee')
        .populate('institutional_subtype', 'name base_fee')
        .sort({ name: 1 })
        .limit(50);
    } else {
      // If query has value, perform search
      const searchRegex = new RegExp(query, 'i');

      customers = await Customer.find({
        $or: [
          { name: searchRegex },
          { phone: searchRegex },
          { address: searchRegex },
          { house_number: searchRegex }
        ]
      })
      .populate('street', 'name')
      .populate('apartment_type', 'name base_fee')
      .populate('commercial_subtype', 'name base_fee')
      .populate('institutional_subtype', 'name base_fee')
      .sort({ name: 1 })
      .limit(50);
    }

    const transformedCustomers = customers.map(customer => ({
      _id: customer._id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      house_number: customer.house_number,
      street: customer.street ? {
        _id: customer.street._id,
        streetName: customer.street.name,
      } : null,
      customer_type: customer.customer_type,
      apartment_type: customer.apartment_type,
      commercial_subtype: customer.commercial_subtype,
      institutional_subtype: customer.institutional_subtype,
      base_fee: customer.customer_type === 'residential'
        ? customer.apartment_type?.base_fee
        : customer.customer_type === 'commercial'
        ? customer.commercial_subtype?.base_fee
        : customer.institutional_subtype?.base_fee,
      status: customer.status,
      createdAt: customer.created_at,
    }));

    res.json({
      success: true,
      message: customers.length === 0 ? 'No customers found' : 'Customers found',
      customers: transformedCustomers,
      count: customers.length
    });

  } catch (error) {
    console.error('Search customers error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during search' 
    });
  }
};

// Get customer billing history with detailed breakdown
const getCustomerBillingHistory = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { months = 12 } = req.query; // Default to last 12 months

    // Get customer details
    const customer = await Customer.findById(customerId)
      .populate('street', 'name')
      .populate('apartment_type', 'name base_fee')
      .populate('commercial_subtype', 'name base_fee')
      .populate('institutional_subtype', 'name base_fee');

    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    // Calculate date range for the requested months
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    // Get all payments for this customer within date range
    const payments = await Payment.find({ 
      customer_id: customerId,
      payment_date: { $gte: startDate, $lte: endDate }
    })
    .populate('agent_id', 'full_name username')
    .populate('verified_by', 'full_name')
    .sort({ payment_date: -1 });

    // Calculate summary statistics
    const totalPaidResult = await Payment.aggregate([
      { 
        $match: { 
          customer_id: new mongoose.Types.ObjectId(customerId), 
          payment_status: 'paid',
          payment_date: { $gte: startDate, $lte: endDate }
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' } 
        } 
      }
    ]);

    const pendingPaymentsResult = await Payment.aggregate([
      { 
        $match: { 
          customer_id: new mongoose.Types.ObjectId(customerId), 
          payment_status: 'pending',
          payment_date: { $gte: startDate, $lte: endDate }
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' } 
        } 
      }
    ]);

    const totalPaid = totalPaidResult[0]?.total || 0;
    const totalPending = pendingPaymentsResult[0]?.total || 0;

    // Calculate total outstanding from monthly_fees for the period
    const totalOutstanding = customer.monthly_fees
      .filter(fee => fee.month >= startDate && fee.month <= endDate)
      .reduce((sum, fee) => sum + Math.max(0, fee.remaining_balance), 0);

    // Group payments by month for easy display
    const paymentsByMonth = {};
    payments.forEach(payment => {
      const monthKey = payment.month.toISOString().slice(0, 7); // YYYY-MM format
      if (!paymentsByMonth[monthKey]) {
        paymentsByMonth[monthKey] = [];
      }
      paymentsByMonth[monthKey].push(payment);
    });

    // Prepare monthly fee details with payment status for the period
    const monthlyFeeDetails = customer.monthly_fees
      .filter(fee => fee.month >= startDate && fee.month <= endDate)
      .map(fee => {
        const monthPayments = payments.filter(p => 
          p.month.getTime() === fee.month.getTime()
        );
        
        const paidAmount = monthPayments
          .filter(p => p.payment_status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0);

        return {
          month: fee.month,
          total_fee: fee.total_fee,
          paid_amount: paidAmount,
          remaining_balance: fee.remaining_balance,
          status: fee.remaining_balance <= 0 ? 'paid' : 
                  paidAmount > 0 ? 'partial' : 'unpaid',
          payment_count: monthPayments.length,
          payments: monthPayments
        };
      })
      .sort((a, b) => b.month - a.month); // Sort by latest month first

    // Calculate payment method breakdown
    const paymentMethodBreakdown = await Payment.aggregate([
      {
        $match: {
          customer_id: new mongoose.Types.ObjectId(customerId),
          payment_status: 'paid',
          payment_date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$payment_method',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Calculate monthly trend
    const monthlyTrend = await Payment.aggregate([
      {
        $match: {
          customer_id: new mongoose.Types.ObjectId(customerId),
          payment_status: 'paid',
          payment_date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$month' },
            month: { $month: '$month' }
          },
          total_paid: { $sum: '$amount' },
          payment_count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      success: true,
      message: 'Billing history retrieved successfully',
      data: {
        customer: {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
          house_number: customer.house_number,
          street: customer.street ? {
            _id: customer.street._id,
            streetName: customer.street.name,
          } : null,
          customer_type: customer.customer_type,
          apartment_type: customer.apartment_type,
          commercial_subtype: customer.commercial_subtype,
          institutional_subtype: customer.institutional_subtype,
          base_fee: customer.customer_type === 'residential'
            ? customer.apartment_type?.base_fee
            : customer.customer_type === 'commercial'
            ? customer.commercial_subtype?.base_fee
            : customer.institutional_subtype?.base_fee,
          status: customer.status
        },
        summary: {
          total_paid: totalPaid,
          total_pending: totalPending,
          total_outstanding: totalOutstanding,
          monthly_fee: customer.customer_type === 'residential'
            ? customer.apartment_type?.base_fee
            : customer.customer_type === 'commercial'
            ? customer.commercial_subtype?.base_fee
            : customer.institutional_subtype?.base_fee,
          period: {
            start: startDate,
            end: endDate,
            months: parseInt(months)
          }
        },
        payments: payments,
        payments_by_month: paymentsByMonth,
        monthly_fees: monthlyFeeDetails,
        analytics: {
          payment_methods: paymentMethodBreakdown,
          monthly_trend: monthlyTrend,
          statistics: {
            total_payments: payments.length,
            paid_payments: payments.filter(p => p.payment_status === 'paid').length,
            pending_payments: payments.filter(p => p.payment_status === 'pending').length,
            verified_payments: payments.filter(p => p.verified === true).length,
            cash_payments: payments.filter(p => p.payment_method === 'cash').length,
            transfer_payments: payments.filter(p => p.payment_method === 'transfer').length
          }
        }
      }
    });

  } catch (error) {
    console.error('Get billing history error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching billing history' 
    });
  }
};

// Get single payment details
const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('customer_id', 'name phone email address house_number')
      .populate('agent_id', 'full_name username tel')
      .populate('verified_by', 'full_name username')
      .populate({
        path: 'customer_id',
        populate: [
          { path: 'street', select: 'name' },
          { path: 'apartment_type', select: 'name base_fee' },
          { path: 'commercial_subtype', select: 'name base_fee' },
          { path: 'institutional_subtype', select: 'name base_fee' }
        ]
      });

    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }

    res.json({
      success: true,
      message: 'Payment details retrieved successfully',
      payment: payment
    });

  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching payment details' 
    });
  }
};

// Get billing overview for multiple customers (for manager dashboard)
const getBillingOverview = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, customer_type } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (customer_type) filter.customer_type = customer_type;

    const customers = await Customer.find(filter)
      .populate('street', 'name')
      .populate('apartment_type', 'name base_fee')
      .populate('commercial_subtype', 'name base_fee')
      .populate('institutional_subtype', 'name base_fee')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Enhanced billing data for each customer
    const customersWithBilling = await Promise.all(
      customers.map(async (customer) => {
        // Get current month's fee status
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);

        const currentMonthFee = customer.monthly_fees.find(
          fee => fee.month.getTime() === currentMonth.getTime()
        );

        // Get recent payments (last 3 months)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const recentPayments = await Payment.find({
          customer_id: customer._id,
          payment_date: { $gte: threeMonthsAgo },
          payment_status: 'paid'
        })
        .sort({ payment_date: -1 })
        .limit(5);

        const totalPaid = await Payment.aggregate([
          {
            $match: {
              customer_id: customer._id,
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

        const baseFee = customer.customer_type === 'residential'
          ? customer.apartment_type?.base_fee
          : customer.customer_type === 'commercial'
          ? customer.commercial_subtype?.base_fee
          : customer.institutional_subtype?.base_fee;

        return {
          _id: customer._id,
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          house_number: customer.house_number,
          street: customer.street?.name,
          customer_type: customer.customer_type,
          status: customer.status,
          base_fee: baseFee,
          current_month: {
            status: currentMonthFee ? 
              (currentMonthFee.remaining_balance <= 0 ? 'paid' : 
               currentMonthFee.remaining_balance < baseFee ? 'partial' : 'unpaid') : 'unpaid',
            remaining_balance: currentMonthFee?.remaining_balance || baseFee,
            due_date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 10) // 10th of next month
          },
          payment_summary: {
            total_paid: totalPaid[0]?.total || 0,
            recent_payments: recentPayments.length,
            last_payment_date: recentPayments[0]?.payment_date || null
          },
          billing_status: getBillingStatus(customer, currentMonthFee, baseFee)
        };
      })
    );

    const total = await Customer.countDocuments(filter);

    res.json({
      success: true,
      data: {
        customers: customersWithBilling,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalCustomers: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get billing overview error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching billing overview' 
    });
  }
};

// Get overdue accounts
const getOverdueAccounts = async (req, res) => {
  try {
    const { months = 3 } = req.query; // Default to 3 months overdue

    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - parseInt(months));

    // Find customers with unpaid balances from previous months
    const overdueCustomers = await Customer.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $unwind: '$monthly_fees'
      },
      {
        $match: {
          'monthly_fees.month': { $lt: cutoffDate },
          'monthly_fees.remaining_balance': { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          phone: { $first: '$phone' },
          address: { $first: '$address' },
          total_overdue: { $sum: '$monthly_fees.remaining_balance' },
          overdue_months: { $push: '$monthly_fees.month' }
        }
      },
      {
        $sort: { total_overdue: -1 }
      }
    ]);

    // Populate additional customer details
    const populatedCustomers = await Customer.populate(overdueCustomers, {
      path: '_id',
      select: 'street apartment_type commercial_subtype institutional_subtype customer_type',
      populate: [
        { path: 'street', select: 'name' },
        { path: 'apartment_type', select: 'name base_fee' },
        { path: 'commercial_subtype', select: 'name base_fee' },
        { path: 'institutional_subtype', select: 'name base_fee' }
      ]
    });

    res.json({
      success: true,
      data: {
        overdue_customers: populatedCustomers,
        summary: {
          total_overdue_amount: populatedCustomers.reduce((sum, customer) => sum + customer.total_overdue, 0),
          total_overdue_customers: populatedCustomers.length,
          cutoff_date: cutoffDate
        }
      }
    });

  } catch (error) {
    console.error('Get overdue accounts error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching overdue accounts' 
    });
  }
};

// Generate billing report
const generateBillingReport = async (req, res) => {
  try {
    const { start_date, end_date, customer_type, format = 'json' } = req.query;

    const startDate = start_date ? new Date(start_date) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = end_date ? new Date(end_date) : new Date();

    const filter = { payment_date: { $gte: startDate, $lte: endDate } };
    if (customer_type) {
      // Get customers of specified type first
      const customers = await Customer.find({ customer_type }).select('_id');
      filter.customer_id = { $in: customers.map(c => c._id) };
    }

    const reportData = await Payment.aggregate([
      {
        $match: filter
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
          _id: {
            customer_type: '$customer.customer_type',
            payment_method: '$payment_method',
            status: '$payment_status'
          },
          total_amount: { $sum: '$amount' },
          payment_count: { $sum: 1 },
          customers: { $addToSet: '$customer_id' }
        }
      },
      {
        $group: {
          _id: '$_id.customer_type',
          payment_methods: {
            $push: {
              method: '$_id.payment_method',
              status: '$_id.status',
              total_amount: '$total_amount',
              payment_count: '$payment_count'
            }
          },
          total_collected: { $sum: '$total_amount' },
          total_payments: { $sum: '$payment_count' },
          unique_customers: { $sum: 1 }
        }
      }
    ]);

    const summary = {
      period: { start: startDate, end: endDate },
      total_collected: reportData.reduce((sum, item) => sum + item.total_collected, 0),
      total_payments: reportData.reduce((sum, item) => sum + item.total_payments, 0),
      breakdown: reportData
    };

    if (format === 'csv') {
      // Generate CSV format (simplified)
      const csvData = generateCSVReport(summary);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=billing-report-${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csvData);
    }

    res.json({
      success: true,
      data: summary
    });

  } catch (error) {
    console.error('Generate billing report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while generating billing report' 
    });
  }
};

// Helper function to determine billing status
const getBillingStatus = (customer, currentMonthFee, baseFee) => {
  if (customer.status !== 'active') return 'inactive';
  
  if (!currentMonthFee) return 'unpaid';
  
  if (currentMonthFee.remaining_balance <= 0) return 'paid';
  if (currentMonthFee.remaining_balance < baseFee) return 'partial';
  
  // Check if previous months are unpaid
  const now = new Date();
  const previousMonths = customer.monthly_fees.filter(fee => 
    fee.month < new Date(now.getFullYear(), now.getMonth(), 1) && 
    fee.remaining_balance > 0
  );
  
  if (previousMonths.length > 0) return 'overdue';
  return 'unpaid';
};

// Helper function to generate CSV report (simplified)
const generateCSVReport = (summary) => {
  let csv = 'Billing Report\n';
  csv += `Period: ${summary.period.start.toISOString().split('T')[0]} to ${summary.period.end.toISOString().split('T')[0]}\n`;
  csv += `Total Collected: ${summary.total_collected}\n`;
  csv += `Total Payments: ${summary.total_payments}\n\n`;
  
  csv += 'Customer Type,Payment Method,Status,Amount,Count\n';
  
  summary.breakdown.forEach(type => {
    type.payment_methods.forEach(method => {
      csv += `${type._id},${method.method},${method.status},${method.total_amount},${method.payment_count}\n`;
    });
  });
  
  return csv;
};

module.exports = {
  searchCustomers,
  getCustomerBillingHistory,
  getPaymentDetails,
  getBillingOverview,
  getOverdueAccounts,
  generateBillingReport
};