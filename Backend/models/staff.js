const mongoose = require('mongoose')

const staffSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true},
    email: { type: String ,  required: true,   unique: true},
    companyId: {type: String , required: true},
    password: {type: String, required:true},
    tel: { type: String , required: true},
    role: {type: String, enum: [ 'admin', 'customer care', 'supervisor','field_agent', 'driver', ]},
    full_name: {type: String, required: true },
    created_at: {type: Date, default: Date.now()},
    updated_at: {type: Date, default: Date.now()},
    last_login: {type: Date},
    status: {type: String, default: 'active', enum: ['active', 'deativated', 'unavailable', 'Terminated']}

}) 
 





const Staff = mongoose.model('Staffs', staffSchema)

module.exports = Staff