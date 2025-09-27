
const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema({
  plate_number: { type: String, required: true, unique: true, trim: true },
  truckModel: { type: String, required: true, trim: true },
  truckCapacity: { type: Number, required: true, min: 0 },
  truckStatus: { type: String, enum: ['operational', 'maintenance', 'inactive'], default: 'operational' },
  assigned_team: { type: mongoose.Schema.Types.ObjectId, ref: 'Teams' },
  maintenance_history: [{
    issue: { type: String, required: true },
    reported_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    resolved: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
  }],
  assignment_history: [{
    assigned_team: { type: mongoose.Schema.Types.ObjectId, ref: 'Teams' },
    date: { type: Date, default: Date.now }
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const Truck = mongoose.model('Trucks', truckSchema);

module.exports = Truck;
