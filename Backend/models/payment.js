const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customers', required: true },
  amount: { type: Number, required: true, min: 0 },
  payment_status: { type: String, enum: ['paid', 'pending', 'unpaid'], required: true },
  payment_method: { type: String, enum: ['cash', 'transfer'], required: true },
  month: { type: Date, required: true },
  payment_date: { type: Date, default: Date.now },
  description: { type: String, default: function() { return `Payment for ${this.month.toISOString().slice(0,7)}`; } },
  agent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staffs' },
  agent_notes: { type: String, default: '' },
  verified: { type: Boolean, default: false },
  verified_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Staffs' },
  verified_date: { type: Date },
  is_full_payment: { type: Boolean, default: false },
  pickup_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Pickups' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Indexes
paymentSchema.index({ companyId: 1, customer_id: 1, month: -1 });
paymentSchema.index({ companyId: 1, payment_date: -1 });
paymentSchema.index({ companyId: 1, agent_id: 1, payment_date: -1 });

paymentSchema.pre('save', function(next) {
  if (this.payment_method === 'cash') {
    this.verified = true;
    this.verified_by = this.agent_id;
    this.verified_date = new Date();
  }
  this.updated_at = Date.now();
  next();
});

const Payment = mongoose.model('Payments', paymentSchema);
module.exports = Payment;