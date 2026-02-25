const Staff = require('../models/staff')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Company = require('../models/company')


const createStaff = async (req, res) => {
  try {
    const { email, password, tel, role, full_name } = req.body;

    const adminCompanyId = req.user.companyId;

    const company = await Company.findById(adminCompanyId);

   if (!company) {
        return res.status(404).json({ message: "Company not found" });
    }
    if (company.subscription_status === 'trial') {
      const staffCount = await Staff.countDocuments({ companyId: adminCompanyId });
      if (staffCount >= 1) {  // If they already have 1 staff
        return res.status(403).json({
          message: "Trial accounts are limited to 1 account. Please upgrade to add more staff."
        });
      }
    }
      // Validate common fields
      if (!tel || !role || !full_name || !email) {
        return res.status(400).json({ message: "Phone, role, email and full name are required" });
      }


      // Check if role requires login credentials
      if (role !== 'driver' && role !== 'field_agent') {
        if (!password) {
          return res.status(400).json({
            message: "Password are required for this role"
          });
        }

        // Check for existing staff with same email
        const existingStaff = await Staff.findOne({ email: email });

        if (existingStaff) {
          return res.status(400).json({
            message: "User with this email already exists"
          });
        }

        // Hash password and create staff
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newStaff = new Staff({
          email,
          password: hashedPassword,
          tel,
          role,
          full_name,
          companyId: company._id
        });
        await newStaff.save();
        return res.status(201).json({ message: 'Staff account created successfully' });

      } else {
        // For driver/field_agent: Use generated defaults
        const newStaff = new Staff({
          email,
          tel,
          role,
          full_name,
          companyId: company._id
        });
        await newStaff.save();
        return res.status(201).json({
          message: `${role} ${full_name} added successfully`
        });
      }

    } catch (error) {
      console.error('Create staff error:', error.message);
      res.status(500).json({ message: 'Server error' });
    }
  };


  const loginStaff = async (req, res) => {

    // console.log('login route inititted from mobile app ')

    try {
      // accepting the user details 
      const { password, email } = req.body

      //  SANITIZATION: Force inputs to be strings to prevent $gt or $ne attacks
        if (typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ message: 'Invalid input format' });
        }

     

      const existingStaff = await Staff.findOne({ email: email })

      if (!existingStaff) {
        return res.status(401).send('User does not exist or email is Incorrect')
      }

      const existingCompany = await Company.findById(existingStaff.companyId)

      const compare = await bcrypt.compare(password, existingStaff.password)

      if (compare === true) {

        const payload = {
          user: {
            id: existingStaff.id,
            role: existingStaff.role,
            full_name: existingStaff.full_name,
            companyId: existingStaff.companyId,
            companySubStatus: existingCompany.subscription_status,
            companyName: existingCompany.name
          }
        }
 
        jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: '1d' },
          (error, token) => {
            if (error) { return res.status(400).json(error) }
            return res.status(200).json({ token, role: existingStaff.role })
          }

        )

   

      } else {
        return res.status(400).send('Incorrect Password')
      }
    } catch (error) {
      return res.status(500).json({ message: 'Server error' })
    }



  }


  // Get all staff members
  const getAllStaff = async (req, res) => {
    try {
      const companyId = req.user.companyId

      const company = await Company.findById(companyId)

   if (!company) {
        return res.status(404).json({ message: "Company not found" });
    }

      const staffList = await Staff.find({companyId: companyId});
      res.status(200).json(staffList);
    } catch (error) {
      console.error('Get all staff error:', error.message);
      res.status(500).json({ message: 'Server error' });
    }
  };

  module.exports = {
    createStaff,
    loginStaff,
    getAllStaff
  }
