const Payment = require('../models/payment');
const Customer = require('../models/customer');
const mongoose = require('mongoose');
const { generatePaymentReceipt } = require('../utils/receiptGenerator');
const { sendPaymentReceipt } = require('../utils/emailService');
const InstitutionalSubtype = require('../models/institutional'); // Add this import

// Create a new payment with comprehensive validation and dynamic month handling
const createPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      customer_id,
      amount,
      payment_status,
      payment_method,
      month,
      agent_id,
      agent_notes,
      verified,
      verified_by,
      verified_date,
      is_full_payment,
      pickup_id,
      allow_overpayment
    } = req.body;

    // Validate required fields
    if (!customer_id || !amount || !payment_status || !payment_method || !month) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    // Validate amount is positive
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Payment amount must be greater than zero' });
    }

    // Verify customer exists
    const customer = await Customer.findById(customer_id)
      .populate('apartment_type commercial_subtype institutional_subtype') // Add institutional_subtype
      .session(session);

    if (!customer) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Parse month to first day of the month (UTC to avoid timezone shifts)
    const [year, monthNum] = month.split('-').map(Number);
    const paymentMonth = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0));

    // Validate month format
    if (isNaN(paymentMonth.getTime())) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Invalid month format. Use YYYY-MM' });
    }

    let totalFee = 0;
    if (customer.customer_type === 'residential' && customer.apartment_type) {
      totalFee = customer.apartment_type.base_fee;
    } else if (customer.customer_type === 'commercial' && customer.commercial_subtype) {
      totalFee = customer.commercial_subtype.base_fee;
    } else if (customer.customer_type === 'institutional' && customer.institutional_subtype) {
      totalFee = customer.institutional_subtype.base_fee;
    }

    if (totalFee === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        message: 'Cannot determine fee for this customer. Missing apartment/commercial/institutional type.'
      });
    }
    // CHECK 1: Prevent duplicate payments (same customer, same month, same amount, within 5 minutes)
    const recentDuplicate = await Payment.findOne({
      customer_id,
      month: paymentMonth,
      amount: paymentAmount,
      payment_date: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    }).session(session);

    if (recentDuplicate) {
      await session.abortTransaction();
      return res.status(400).json({
        message: 'Duplicate payment detected. A similar payment was just recorded.',
        duplicate_payment_id: recentDuplicate._id
      });
    }

    // CHECK 2: Check if month exists in customer's monthly_fees records
    const monthlyFeeIndex = customer.monthly_fees.findIndex(
      fee => fee.month.getTime() === paymentMonth.getTime()
    );

    let totalPaidSoFar = 0;
    let remainingBeforeThisPayment = totalFee;

    if (monthlyFeeIndex !== -1) {
      // Month has records - calculate from existing data
      const existingFee = customer.monthly_fees[monthlyFeeIndex];
      totalPaidSoFar = existingFee.total_fee - existingFee.remaining_balance;
      remainingBeforeThisPayment = existingFee.remaining_balance;
    } else {
      // Month has no records - use base fee as full amount
      // We'll calculate payments from Payment collection to be safe
      const existingPayments = await Payment.aggregate([
        {
          $match: {
            customer_id: new mongoose.Types.ObjectId(customer_id),
            month: paymentMonth,
            payment_status: { $in: ['paid', 'pending'] }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).session(session);

      totalPaidSoFar = existingPayments.length > 0 ? existingPayments[0].total : 0;
      remainingBeforeThisPayment = totalFee - totalPaidSoFar;
    }

    // CHECK 3: Warn about overpayment (but allow it if flag is set)
    let overpaymentWarning = null;
    if (paymentAmount > remainingBeforeThisPayment && remainingBeforeThisPayment > 0) {
      overpaymentWarning = `Payment of ₦${paymentAmount} exceeds remaining balance of ₦${remainingBeforeThisPayment}. Overpayment of ₦${paymentAmount - remainingBeforeThisPayment} will be recorded.`;
    }

    // CHECK 4: Prevent payment if already fully paid (optional - can be disabled)
    if (remainingBeforeThisPayment <= 0 && !allow_overpayment) {
      await session.abortTransaction();
      return res.status(400).json({
        message: `This month is already fully paid. Total fee: ₦${totalFee}, Already paid: ₦${totalPaidSoFar}`,
        allow_overpayment_hint: 'Set allow_overpayment=true to override'
      });
    }

    // Create the payment object
    const paymentData = {
      customer_id,
      amount: paymentAmount,
      payment_status,
      payment_method,
      month: paymentMonth,
      agent_id,
      agent_notes: agent_notes || '',
      verified: payment_method === 'cash' ? true : verified || false,
      verified_by: payment_method === 'cash' ? agent_id : verified_by || null,
      verified_date: payment_method === 'cash' ? new Date() : verified_date || null,
      is_full_payment: is_full_payment || false,
      pickup_id: pickup_id || null
    };

    const payment = new Payment(paymentData);
    const savedPayment = await payment.save({ session });

    // Update customer's monthly_fees array
    const newTotalPaid = totalPaidSoFar + paymentAmount;
    const newRemainingBalance = totalFee - newTotalPaid;

    if (monthlyFeeIndex === -1) {
      // Create new monthly fee entry (month didn't exist in records)
      customer.monthly_fees.push({
        month: paymentMonth,
        total_fee: totalFee,
        remaining_balance: newRemainingBalance,
        payments: [savedPayment._id]
      });
    } else {
      // Update existing monthly fee entry
      const existingFee = customer.monthly_fees[monthlyFeeIndex];
      existingFee.payments.push(savedPayment._id);
      existingFee.remaining_balance = newRemainingBalance;
    }

    customer.updated_at = new Date();
    await customer.save({ session });

    await session.commitTransaction();

    // Generate receipt and send email if customer has email
    const receiptNumber = `RCP-${Date.now()}-${savedPayment._id.toString().slice(-6).toUpperCase()}`;
    let receiptSent = false;
    let emailError = null;

     if (customer.email && customer.email.trim() !== '') {
      try {
        // Populate customer references for full address - FIXED
        await customer.populate('street apartment_type commercial_subtype institutional_subtype');

        // Prepare receipt data
        const receiptData = {
          companyName: process.env.COMPANY_NAME || 'WASTE MANAGEMENT SERVICES',
          companyAddress: process.env.COMPANY_ADDRESS || 'Lagos, Nigeria',
          companyPhone: process.env.COMPANY_PHONE || '+234 XXX XXX XXXX',
          companyEmail: process.env.COMPANY_EMAIL || 'info@wastemanagement.com',
          receiptNumber: receiptNumber,
          paymentDate: savedPayment.payment_date,
          month: (() => {
            const [year, monthNum] = month.split('-').map(Number);
            const date = new Date(Date.UTC(year, monthNum - 1, 1));
            return date.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
              timeZone: 'UTC'
            });
          })(),
          customerName: customer.name,
          customerAddress: `${customer.address}, ${customer.house_number} ${customer.street?.name || ''}`.trim(),
          customerPhone: customer.phone,
          customerEmail: customer.email,
          paymentMethod: savedPayment.payment_method,
          totalFee: totalFee,
          amountPaid: paymentAmount,
          totalPaid: newTotalPaid,
          remainingBalance: Math.max(0, newRemainingBalance),
          agentNotes: savedPayment.agent_notes || '',
        };

        // Generate PDF
        const pdfBuffer = await generatePaymentReceipt(receiptData);

        // Send email with receipt
        await sendPaymentReceipt({
          to: customer.email,
          customerName: customer.name,
          pdfBuffer: pdfBuffer,
          paymentDetails: {
            receiptNumber: receiptNumber,
            paymentDate: savedPayment.payment_date,
            month: receiptData.month,
            paymentMethod: savedPayment.payment_method,
            amountPaid: paymentAmount,
            totalFee: totalFee,
            totalPaid: newTotalPaid,
            remainingBalance: Math.max(0, newRemainingBalance),
            agentNotes: savedPayment.agent_notes || '',
          },
        });

        receiptSent = true;
        console.log(`✓ Receipt sent successfully to ${customer.email}`);
      } catch (error) {
        console.error('✗ Error sending receipt email:', error.message);
        emailError = error.message;
        // Don't fail the payment if email fails
      }
    } else {
      console.log('ℹ No email address for customer, skipping receipt email');
    }

    return res.status(201).json({
      message: 'Payment recorded successfully',
      payment: savedPayment,
      payment_summary: {
        total_fee: totalFee,
        total_paid: newTotalPaid,
        remaining_balance: newRemainingBalance,
        is_fully_paid: newRemainingBalance <= 0,
        overpayment_amount: newRemainingBalance < 0 ? Math.abs(newRemainingBalance) : 0
      },
      receipt: {
        sent: receiptSent,
        email: customer.email || null,
        receipt_number: receiptNumber,
        error: emailError
      },
      warning: overpaymentWarning
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating payment:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    session.endSession();
  }
};

// Get payments by customer with detailed summary
const getPaymentsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId)
      .populate('apartment_type commercial_subtype');

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const payments = await Payment.find({ customer_id: customerId })
      .sort({ month: -1, payment_date: -1 })
      .populate('agent_id', 'full_name username email')
      .populate('verified_by', 'full_name username');

    // Group payments by month
    const paymentsByMonth = {};
    payments.forEach(payment => {
      const monthKey = payment.month.toISOString().slice(0, 7);
      if (!paymentsByMonth[monthKey]) {
        paymentsByMonth[monthKey] = [];
      }
      paymentsByMonth[monthKey].push(payment);
    });

    return res.status(200).json({
      message: payments.length === 0 ? 'No payments found' : 'Payments found',
      customer_name: customer.name,
      monthly_fee: customer.customer_type === 'residential'
        ? customer.apartment_type?.base_fee
        : customer.commercial_subtype?.base_fee,
      payments,
      payments_by_month: paymentsByMonth,
      monthly_fees: customer.monthly_fees.sort((a, b) => b.month - a.month)
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Verify a payment (for non-cash payments)
const verifyPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentId } = req.params;
    const { verified_by } = req.body;

    if (!verified_by) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Verified by ID is required' });
    }

    const payment = await Payment.findById(paymentId).session(session);
    if (!payment) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.payment_method === 'cash') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cash payments are auto-verified' });
    }

    if (payment.verified) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Payment already verified' });
    }

    payment.verified = true;
    payment.verified_by = verified_by;
    payment.verified_date = new Date();
    payment.payment_status = 'paid';

    const updatedPayment = await payment.save({ session });

    // Recalculate customer balance
    const customer = await Customer.findById(payment.customer_id).session(session);
    if (customer) {
      const monthlyFeeIndex = customer.monthly_fees.findIndex(
        fee => fee.month.getTime() === payment.month.getTime()
      );

      if (monthlyFeeIndex !== -1) {
        const totalPaid = await Payment.aggregate([
          {
            $match: {
              customer_id: customer._id,
              month: payment.month,
              payment_status: 'paid'
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).session(session);

        const amountPaid = totalPaid.length > 0 ? totalPaid[0].total : 0;
        customer.monthly_fees[monthlyFeeIndex].remaining_balance =
          customer.monthly_fees[monthlyFeeIndex].total_fee - amountPaid;

        await customer.save({ session });
      }
    }

    await session.commitTransaction();

    return res.status(200).json({
      message: 'Payment verified successfully',
      payment: updatedPayment,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error verifying payment:', error);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    session.endSession();
  }
};

// Get payment summary for a customer with detailed monthly breakdown
const getPaymentSummary = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId)
      .populate('apartment_type commercial_subtype');

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const totalOwed = customer.monthly_fees.reduce(
      (sum, fee) => sum + Math.max(0, fee.remaining_balance), 0
    );

    const totalOverpayment = customer.monthly_fees.reduce(
      (sum, fee) => sum + Math.abs(Math.min(0, fee.remaining_balance)), 0
    );

    const totalPaid = await Payment.aggregate([
      { $match: { customer_id: customer._id, payment_status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingPayments = await Payment.aggregate([
      { $match: { customer_id: customer._id, payment_status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Enhanced monthly fees with payment details
    const monthlyFeesWithDetails = await Promise.all(
      customer.monthly_fees.map(async (fee) => {
        const payments = await Payment.find({
          _id: { $in: fee.payments }
        }).populate('agent_id', 'full_name username');

        return {
          month: fee.month,
          total_fee: fee.total_fee,
          remaining_balance: fee.remaining_balance,
          paid_amount: fee.total_fee - fee.remaining_balance,
          status: fee.remaining_balance === 0 ? 'paid' : fee.remaining_balance === fee.total_fee ? 'unpaid' : 'partial',
          payment_count: payments.length,
          payments: payments.map(p => ({
            id: p._id,
            amount: p.amount,
            payment_date: p.payment_date,
            payment_method: p.payment_method,
            agent: p.agent_id?.full_name || 'Unknown'
          }))
        };
      })
    );

    return res.status(200).json({
      customer_name: customer.name,
      customer_type: customer.customer_type,
      monthly_fee: customer.customer_type === 'residential'
        ? customer.apartment_type?.base_fee
        : customer.commercial_subtype?.base_fee,
      total_paid: totalPaid.length > 0 ? totalPaid[0].total : 0,
      total_pending: pendingPayments.length > 0 ? pendingPayments[0].total : 0,
      total_outstanding: totalOwed,
      total_overpayment: totalOverpayment,
      monthly_fees: monthlyFeesWithDetails.sort((a, b) => b.month - a.month)
    });
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete/Cancel a payment (Manager only)
const cancelPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findById(paymentId).session(session);
    if (!payment) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Remove payment from customer's monthly_fees
    const customer = await Customer.findById(payment.customer_id).session(session);
    if (customer) {
      const monthlyFeeIndex = customer.monthly_fees.findIndex(
        fee => fee.month.getTime() === payment.month.getTime()
      );

      if (monthlyFeeIndex !== -1) {
        const feeEntry = customer.monthly_fees[monthlyFeeIndex];
        feeEntry.payments = feeEntry.payments.filter(
          p => p.toString() !== paymentId
        );

        // Recalculate remaining balance
        const remainingPayments = await Payment.find({
          _id: { $in: feeEntry.payments },
          payment_status: 'paid'
        }).session(session);

        const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);
        feeEntry.remaining_balance = feeEntry.total_fee - totalPaid;

        await customer.save({ session });
      }
    }

    await Payment.findByIdAndDelete(paymentId).session(session);
    await session.commitTransaction();

    return res.status(200).json({
      message: 'Payment cancelled successfully',
      cancelled_payment: {
        id: payment._id,
        amount: payment.amount,
        month: payment.month,
        reason: reason || 'No reason provided'
      }
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error cancelling payment:', error);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    session.endSession();
  }
};
// Get all payments with filtering and pagination
const getAllPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      customer_id,
      payment_status,
      payment_method,
      month,
      start_date,
      end_date,
      verified
    } = req.query;

    const filter = {};

    // Build filter object
    if (customer_id) filter.customer_id = customer_id;
    if (payment_status) filter.payment_status = payment_status;
    if (payment_method) filter.payment_method = payment_method;
    if (verified !== undefined) filter.verified = verified === 'true';
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      filter.month = {
        $gte: new Date(year, monthNum - 1, 1),
        $lt: new Date(year, monthNum, 1)
      };
    }
    if (start_date || end_date) {
      filter.payment_date = {};
      if (start_date) filter.payment_date.$gte = new Date(start_date);
      if (end_date) filter.payment_date.$lte = new Date(end_date);
    }

    const payments = await Payment.find(filter)
      .populate('customer_id', 'name phone email address')
      .populate('agent_id', 'full_name username')
      .populate('verified_by', 'full_name username')
      .sort({ payment_date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(filter);

    return res.status(200).json({
      message: payments.length === 0 ? 'No payments found' : 'Payments retrieved successfully',
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPayments: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get all payments error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get payments by month
const getPaymentsByMonth = async (req, res) => {
  try {
    const { month } = req.params; // Format: YYYY-MM
    const { page = 1, limit = 50 } = req.query;

    const [year, monthNum] = month.split('-').map(Number);
    const monthStart = new Date(year, monthNum - 1, 1);
    const monthEnd = new Date(year, monthNum, 1);

    const payments = await Payment.find({
      month: { $gte: monthStart, $lt: monthEnd }
    })
      .populate('customer_id', 'name phone address house_number')
      .populate('agent_id', 'full_name username')
      .populate('verified_by', 'full_name username')
      .sort({ payment_date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments({
      month: { $gte: monthStart, $lt: monthEnd }
    });

    // Calculate summary for the month
    const summary = await Payment.aggregate([
      {
        $match: {
          month: { $gte: monthStart, $lt: monthEnd },
          payment_status: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          total_collected: { $sum: '$amount' },
          payment_count: { $sum: 1 },
          cash_total: {
            $sum: { $cond: [{ $eq: ['$payment_method', 'cash'] }, '$amount', 0] }
          },
          transfer_total: {
            $sum: { $cond: [{ $eq: ['$payment_method', 'transfer'] }, '$amount', 0] }
          }
        }
      }
    ]);

    return res.status(200).json({
      message: payments.length === 0 ? 'No payments found for this month' : 'Monthly payments retrieved successfully',
      month: month,
      summary: summary[0] || {
        total_collected: 0,
        payment_count: 0,
        cash_total: 0,
        transfer_total: 0
      },
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalPayments: total
      }
    });

  } catch (error) {
    console.error('Get payments by month error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update payment endpoint
const updatePayment = async (req, res) => {
  if (req.user && req.user.role !== 'manager') {
    return res.status(403).json({ message: 'Only Manager can update payments' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentId } = req.params;
    const {
      amount,
      payment_status,
      payment_method,
      agent_notes,
      verified,
      verified_by
    } = req.body;

    const payment = await Payment.findById(paymentId).session(session);
    if (!payment) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Store original values for recalculation
    const originalAmount = payment.amount;
    const originalStatus = payment.payment_status;

    // Update fields if provided
    if (amount !== undefined) payment.amount = parseFloat(amount);
    if (payment_status !== undefined) payment.payment_status = payment_status;
    if (payment_method !== undefined) payment.payment_method = payment_method;
    if (agent_notes !== undefined) payment.agent_notes = agent_notes;
    if (verified !== undefined) payment.verified = verified;
    if (verified_by !== undefined) payment.verified_by = verified_by;

    // Auto-verify cash payments
    if (payment.payment_method === 'cash') {
      payment.verified = true;
      payment.verified_by = payment.agent_id;
      payment.verified_date = new Date();
    }

    // If payment status changed to paid or amount changed, recalculate customer balance
    if (payment.amount !== originalAmount || payment.payment_status !== originalStatus) {
      const customer = await Customer.findById(payment.customer_id).session(session);
      if (customer) {
        const monthlyFeeIndex = customer.monthly_fees.findIndex(
          fee => fee.month.getTime() === payment.month.getTime()
        );

        if (monthlyFeeIndex !== -1) {
          const totalPaid = await Payment.aggregate([
            {
              $match: {
                customer_id: customer._id,
                month: payment.month,
                payment_status: 'paid'
              }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
          ]).session(session);

          const amountPaid = totalPaid.length > 0 ? totalPaid[0].total : 0;
          customer.monthly_fees[monthlyFeeIndex].remaining_balance =
            customer.monthly_fees[monthlyFeeIndex].total_fee - amountPaid;

          await customer.save({ session });
        }
      }
    }

    const updatedPayment = await payment.save({ session });
    await session.commitTransaction();

    return res.status(200).json({
      message: 'Payment updated successfully',
      payment: updatedPayment,
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating payment:', error);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    session.endSession();
  }
};


// Get today's collections by supervisor
const getTodayCollections = async (req, res) => {
  try {
    const supervisorId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const collections = await Payment.aggregate([
      {
        $match: {
          agent_id: new mongoose.Types.ObjectId(supervisorId),
          payment_date: { $gte: today },
          payment_status: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      amount: collections[0]?.amount || 0,
      count: collections[0]?.count || 0
    });
  } catch (error) {
    console.error('Get today collections error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createPayment,
  getAllPayments, // Add this
  getPaymentsByCustomer,
  getPaymentsByMonth, // Add this
  verifyPayment,
  getPaymentSummary,
  updatePayment, // Add this
  cancelPayment,
  getTodayCollections
};