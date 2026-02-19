const Company = require('../models/company');
const Staff = require('../models/staff');
const bcrypt = require('bcryptjs');

const registerAll = async (req, res) => {
    // Define this outside so the catch block can access it for rollback
    let createdCompanyId = null;

    try {
        const { companyData, adminData } = req.body;

        // Validation Fix: Added ! before companyData.country
        if (!companyData.name || !companyData.email || !companyData.address || !companyData.country || !companyData.tel) {
            return res.status(400).json({ message: 'All company fields (name, email, address, country, tel) are required.' });
        }

        if (!adminData.email || !adminData.password || !adminData.full_name) {
            return res.status(400).json({ message: 'Missing admin account details (email, password, or full name).' });
        }

        // Check for existing company
        const existingCompany = await Company.findOne({
            name: companyData.name,
            country: companyData.country
        });

        if (existingCompany) {
            return res.status(400).json({ message: 'This company name is already registered in your country.' });
        }

        // Check for existing staff email
        const existingStaff = await Staff.findOne({ email: adminData.email });
        if (existingStaff) {
            return res.status(400).json({ message: 'This email is already registered to a staff member.' });
        }

        // Step 1: Create Company
        const newCompany = new Company({
            ...companyData,
            subscription_status: 'trial' 
        });

        await newCompany.save();
        createdCompanyId = newCompany._id; // Assign to the outer variable

        // Step 2: Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminData.password, salt);

        // Step 3: Create Admin Staff
        const newAdmin = new Staff({
            ...adminData,
            password: hashedPassword,
            companyId: createdCompanyId,
            role: 'admin'
        });

        await newAdmin.save();

        return res.status(201).json({
            message: 'Company and Admin Account created successfully. Please log in.'
        });

    } catch (error) {
        // Rollback: If company was created but staff failed, delete the orphan company
        if (createdCompanyId) {
            await Company.findByIdAndDelete(createdCompanyId);
        }
        
        console.error('Registration error:', error.message);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

module.exports = { registerAll };