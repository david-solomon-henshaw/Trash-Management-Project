const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Route name is required'],
    trim: true 
  },
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
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
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

routeSchema.pre('save', function (next) {
  this.updated_at = Date.now();
  next();
});

const Route = mongoose.model('Routes', routeSchema);
module.exports = Route;