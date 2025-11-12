const mongoose = require('mongoose')

const staffSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true},
    email: { type: String ,  required: true,   unique: true},
    password: {type: String},
    tel: { type: String , required: true},
    role: {type: String, enum: ['c_care', 'supervisor','field_agent', 'driver', 'manager']},
    full_name: {type: String, required: true },
    created_at: {type: Date, default: Date.now()},
    updated_at: {type: Date, default: Date.now()},
    last_login: {type: Date},
    status: {type: String, default: 'active', enum: ['active', 'deativated', 'unavailable', 'Terminated']}

}) 
 





const Staff = mongoose.model('Staffs', staffSchema)

module.exports = Staff