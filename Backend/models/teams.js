const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  team_members: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staffs',
        required: [true, 'User ID is required'],
      },
      role: {
        type: String,
        enum: ['supervisor', 'driver', 'field_agent','manager'],
        required: [true, 'Role is required'],
      },
    },
  ],
  assignment_date: {
    type: Date,
    required: [true, 'Assignment date is required'],
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staffs',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Teams', teamSchema);