const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customers', required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Routes', required: true },
  supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'Staffs', required: true },
  service_date: { type: Date, required: true },
  service_month: { type: Date, required: true },
  before_photo: { type: String, required: true },
  after_photo: { type: String, required: false },
  service_notes: { type: String },
  service_status: { type: String, enum: ['serviced', 'not_home', 'refused'], required: true },
  created_at: { type: Date, default: Date.now }
});

// Indexes
serviceSchema.index({ companyId: 1, customer: 1, service_month: 1 });
serviceSchema.index({ companyId: 1, route: 1, service_date: 1 });
serviceSchema.index({ companyId: 1, service_date: -1 });

serviceSchema.pre('save', function(next) {
  if (this.service_status === 'serviced' && !this.after_photo) {
    return next(new Error('After photo is required when service status is "serviced"'));
  }
  next();
});

const Service = mongoose.model('Services', serviceSchema);
module.exports = Service;