const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String,trim: true},
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  house_number: { type: String, required: true, trim: true },
  street: { type: mongoose.Schema.Types.ObjectId, ref: 'Streets', required: true },
  customer_type: { type: String, enum: ['residential', 'commercial', 'institutional'], required: true },
  apartment_type: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ApartmentTypes', 
    required: function() { return this.customer_type === 'residential'; } 
  },
  commercial_subtype: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CommercialSubtypes', 
    required: function() { return this.customer_type === 'commercial'; } 
  },
   institutional_subtype: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'InstitutionalSubtypes', 
    required: function() { return this.customer_type === 'institutional'; } 
  },
  status: { type: String, enum: ['active', 'non-active'], default: 'active' },
  monthly_fees: [{
    month: { type: Date, required: true },
    total_fee: { type: Number, required: true, min: 0 },
    remaining_balance: { type: Number, required: true, min: 0 },
    payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payments' }]
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

customerSchema.index({ street: 1, house_number: 1 });

// Update timestamp on save
customerSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const Customer = mongoose.model('Customers', customerSchema);

module.exports = Customer;