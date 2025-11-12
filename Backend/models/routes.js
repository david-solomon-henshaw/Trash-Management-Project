const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  streets: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Streets' 
  }],
  assigned_team: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Teams',
    required: [true, 'Assigned team is required']
  },
  assigned_truck: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Trucks',
    required: [true, 'Assigned truck is required']
  },
  supervisor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Staffs',
    required: [true, 'Supervisor is required']
  },
  scheduled_date: { 
    type: Date, 
    required: [true, 'Scheduled date is required']
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'in_progress', 'paused', 'at_dumpsite', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  assignment_lifecycle: {
    started_at: { type: Date },
    started_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Staffs' },
    paused_at: { type: Date },
    resumed_at: { type: Date },
    completed_at: { type: Date },
    completed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Staffs' },
    
    current_location: {
      latitude: { type: Number },
      longitude: { type: Number },
      timestamp: { type: Date },
      accuracy: { type: Number },
      speed: { type: Number },
      battery_level: { type: Number }
    },
    
    location_history: [{
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      timestamp: { type: Date, default: Date.now },
      accuracy: { type: Number },
      speed: { type: Number },
      is_moving: { type: Boolean }
    }],
    
    checkpoints: [{
      type: {
        type: String,
        enum: ['start', 'pause', 'resume', 'dumpsite', 'custom', 'end'],
        required: true
      },
      location: {
        latitude: { type: Number },
        longitude: { type: Number }
      },
      timestamp: { type: Date, default: Date.now },
      notes: { type: String }
    }]
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: { 
    type: Date, 
    default: Date.now 
  }
});

routeSchema.methods.addLocation = function(locationData) {
  this.assignment_lifecycle.current_location = {
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    timestamp: new Date(),
    accuracy: locationData.accuracy,
    speed: locationData.speed,
    battery_level: locationData.battery_level
  };
  
  this.assignment_lifecycle.location_history.unshift({
    latitude: locationData.latitude,
    longitude: locationData.longitude,
    timestamp: new Date(),
    accuracy: locationData.accuracy,
    speed: locationData.speed,
    is_moving: locationData.is_moving
  });
};

routeSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

const Route = mongoose.model('Routes', routeSchema);
module.exports = Route;