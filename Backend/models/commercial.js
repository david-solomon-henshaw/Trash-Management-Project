const mongoose = require('mongoose')

const commercialSubtypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  base_fee: { type: Number, required: true, min: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const CommercialSubtype = mongoose.model('CommercialSubtypes', commercialSubtypeSchema
);

module.exports = CommercialSubtype