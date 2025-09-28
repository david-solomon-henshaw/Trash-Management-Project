const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema({
  plate_number: {
    type: String,
    required: [true, 'Plate number is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Plate number must be at least 3 characters'],
  },
  truckModel: {
    type: String,
    required: [true, 'Truck model is required'],
    trim: true,
  },
  truckCapacity: {
    type: Number,
    required: [true, 'Truck capacity is required'],
    min: [0, 'Capacity must be non-negative'],
  },
  truckStatus: {
    type: String,
    enum: ['operational', 'maintenance', 'inactive'],
    required: [true, 'Truck status is required'],
  },
  // Removed assigned_team - now handled through Routes
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
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

truckSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Trucks', truckSchema);