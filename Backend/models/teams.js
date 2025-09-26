const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  team_members: [{
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    role: { type: String, enum: ['supervisor', 'driver', 'packer'], required: true }
  }],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const Team = mongoose.model('Teams', teamSchema);

module.exports = Team;