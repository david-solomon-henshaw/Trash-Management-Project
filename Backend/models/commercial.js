const mongoose = require('mongoose');

const commercialSubtypeSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true, trim: true },
  base_fee: { type: Number, required: true, min: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Unique per company
commercialSubtypeSchema.index({ companyId: 1, name: 1 }, { unique: true });

commercialSubtypeSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const CommercialSubtype = mongoose.model('CommercialSubtypes', commercialSubtypeSchema);
module.exports = CommercialSubtype;