const mongoose = require('mongoose');

const institutionalSubtypeSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true, trim: true },
  base_fee: { type: Number, required: true, min: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Unique per company
institutionalSubtypeSchema.index({ companyId: 1, name: 1 }, { unique: true });

institutionalSubtypeSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const InstitutionalSubtype = mongoose.model('InstitutionalSubtypes', institutionalSubtypeSchema);
module.exports = InstitutionalSubtype;