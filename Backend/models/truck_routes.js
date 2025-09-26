const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  streets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Streets' }],
  assigned_team: { type: mongoose.Schema.Types.ObjectId, ref: 'Teams' },
  assigned_truck: { type: mongoose.Schema.Types.ObjectId, ref: 'Trucks' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const Route = mongoose.model('Routes', routeSchema);

module.exports = Route;