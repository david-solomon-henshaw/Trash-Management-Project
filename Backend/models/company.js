const mongoose = require('mongoose')

const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    tel: { type: String, required: true}, 
    address: { type: String, required: true },
    country: { type: String, required: true },
    subscription_status: { type: String, enum: ['trial', 'active', 'expired'], required: true },
    trial_start_date: { type: Date, required: true }, 
    trial_end_date: { type: Date, required: true },   
    subscription_end_date: { type: Date }, 
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
})


companySchema.index({ email: 1 })
companySchema.index({ subscription_status: 1 })

const Company = mongoose.model('Company', companySchema)

module.exports = Company