const mongoose = require('mongoose')

const streetSchema = new mongoose.Schema({
    name: {type: string, required: true, unique: true, trim: true},
    details: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
})


const Street = mongoose.model('Steets', streetSchema)

module.exports = Street