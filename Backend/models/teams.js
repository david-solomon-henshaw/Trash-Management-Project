const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true }, // e.g., "Morning Shift Team A"
  team_members: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'Staffs', required: true },
      role: { type: String, enum: ['supervisor', 'driver', 'field_agent'], required: true },
    },
  ],
  assignment_date: { type: Date, required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'Staffs' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Indexes
teamSchema.index({ companyId: 1, name: 1 }, { unique: true });
teamSchema.index({ companyId: 1, assignment_date: -1 });

teamSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Teams', teamSchema);