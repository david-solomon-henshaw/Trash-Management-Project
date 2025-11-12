const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Customers', // Fixed: was 'Customer'
    required: true 
  },
  route: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Routes', 
    required: true 
  },
  supervisor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Staffs', // Fixed: was 'Staff'
    required: true 
  },
  service_date: { type: Date, required: true },
  service_month: { type: Date, required: true }, // For monthly billing
  
  // UPDATED: Photo requirements
  before_photo: { 
    type: String, 
    required: true // ALWAYS required - proof of arrival
  },
  after_photo: { 
    type: String, 
    required: false // Only required for 'serviced' status
  },
  
  service_notes: { type: String },
  service_status: { 
    type: String, 
    enum: ['serviced', 'not_home', 'refused'], 
    required: true 
  },
  created_at: { type: Date, default: Date.now }
});

// Custom validation for after_photo
serviceSchema.pre('save', function(next) {
  if (this.service_status === 'serviced' && !this.after_photo) {
    return next(new Error('After photo is required when service status is "serviced"'));
  }
  next();
});

// Index for better query performance
serviceSchema.index({ customer: 1, service_month: 1 });
serviceSchema.index({ route: 1, service_date: 1 });

const Service = mongoose.model('Services', serviceSchema); // Fixed: was 'Service'
module.exports = Service;