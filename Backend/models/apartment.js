const mongoose = require('mongoose');

// Apartment Types Collection
const apartmentTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  base_fee: { type: Number, required: true, min: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const ApartmentType = mongoose.model('ApartmentTypes', apartmentTypeSchema);

module.exports = ApartmentType;