const mongoose = require('mongoose')

const staffSchema = new mongoose.Schema({
    email: { type: String ,  required: true,   unique: true},
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    password: {type: String, required:true},
    tel: { type: String , required: true},
    role: {type: String, enum: [ 'admin', 'customer care', 'supervisor','field_agent', 'driver', ]},
    full_name: {type: String, required: true },
    created_at: {type: Date, default: Date.now()},
    updated_at: {type: Date, default: Date.now()},
    refreshToken: {type: String, default: null },
    last_login: {type: Date},
    status: {type: String, default: 'active', enum: ['active', 'deativated', 'unavailable', 'Terminated']}

}) 
 

staffSchema.pre('save', function(next) {
   this.updated_at = Date.now();
   next();
})


staffSchema.index({refreshToken: -1})


const Staff = mongoose.model('Staffs', staffSchema)

module.exports = Staff