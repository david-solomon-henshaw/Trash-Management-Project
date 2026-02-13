const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  plate_number: { type: String, required: true, trim: true },
  truckModel: { type: String, required: true, trim: true },
  truckCapacity: { type: Number, required: true, min: 0 },
  truckStatus: { type: String, enum: ['operational', 'maintenance', 'inactive'], required: true },
  maintenance_history: [
    {
      maintenance_date: { type: Date, default: Date.now },
      description: String,
    },
  ],
  assignment_history: [
    {
      route: { type: mongoose.Schema.Types.ObjectId, ref: 'Routes' },
      team: { type: mongoose.Schema.Types.ObjectId, ref: 'Teams' },
      logged_at: { type: Date, default: Date.now },
    },
  ],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Unique plate number per company
truckSchema.index({ companyId: 1, plate_number: 1 }, { unique: true });

truckSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Trucks', truckSchema);