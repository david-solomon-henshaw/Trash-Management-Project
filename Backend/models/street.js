const mongoose = require('mongoose');

const streetSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true, trim: true },
  details: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Compound unique: street name must be unique within a company
streetSchema.index({ companyId: 1, name: 1 }, { unique: true });

streetSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const Street = mongoose.model('Streets', streetSchema);
module.exports = Street;