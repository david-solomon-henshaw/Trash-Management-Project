// controllers/billingHistoryController.js
const Customer = require('../models/customer');
const Payment = require('../models/payment');

// Search customers by name, phone, or address
const searchCustomers = async (req, res) => {
  try {
    const { query } = req.query;

    // FIX: Allow empty query to return all customers
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
        .sort({ name: 1 })
        .limit(50);
    } else {
      // If query has value, perform search
      const searchRegex = new RegExp(query, 'i'); // Case-insensitive search

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
      base_fee: customer.customer_type === 'residential'
        ? customer.apartment_type?.base_fee
        : customer.commercial_subtype?.base_fee,
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

// ... rest of your controller code remains the same
const getCustomerBillingHistory = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Get customer details
    const customer = await Customer.findById(customerId)
      .populate('street', 'name')
      .populate('apartment_type', 'name base_fee')
      .populate('commercial_subtype', 'name base_fee');

    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Customer not found' 
      });
    }

    // Get all payments for this customer
    const payments = await Payment.find({ customer_id: customerId })
      .populate('agent_id', 'full_name username')
      .populate('verified_by', 'full_name')
      .sort({ payment_date: -1 });

    // Calculate summary statistics
    const totalPaidResult = await Payment.aggregate([
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

    const pendingPaymentsResult = await Payment.aggregate([
      { 
        $match: { 
          customer_id: customer._id, 
          payment_status: 'pending' 
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

    // Calculate total outstanding from monthly_fees
    const totalOutstanding = customer.monthly_fees.reduce((sum, fee) => {
      return sum + Math.max(0, fee.remaining_balance);
    }, 0);

    // Group payments by month for easy display
    const paymentsByMonth = {};
    payments.forEach(payment => {
      const monthKey = payment.month.toISOString().slice(0, 7); // YYYY-MM format
      if (!paymentsByMonth[monthKey]) {
        paymentsByMonth[monthKey] = [];
      }
      paymentsByMonth[monthKey].push(payment);
    });

    // Prepare monthly fee details with payment status
    const monthlyFeeDetails = customer.monthly_fees.map(fee => {
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
        payment_count: monthPayments.length
      };
    }).sort((a, b) => b.month - a.month); // Sort by latest month first

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
          base_fee: customer.customer_type === 'residential'
            ? customer.apartment_type?.base_fee
            : customer.commercial_subtype?.base_fee,
          status: customer.status
        },
        summary: {
          total_paid: totalPaid,
          total_pending: totalPending,
          total_outstanding: totalOutstanding,
          monthly_fee: customer.customer_type === 'residential'
            ? customer.apartment_type?.base_fee
            : customer.commercial_subtype?.base_fee
        },
        payments: payments,
        payments_by_month: paymentsByMonth,
        monthly_fees: monthlyFeeDetails,
        statistics: {
          total_payments: payments.length,
          paid_payments: payments.filter(p => p.payment_status === 'paid').length,
          pending_payments: payments.filter(p => p.payment_status === 'pending').length,
          verified_payments: payments.filter(p => p.verified === true).length
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
          { path: 'commercial_subtype', select: 'name base_fee' }
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

module.exports = {
  searchCustomers,
  getCustomerBillingHistory,
  getPaymentDetails
};