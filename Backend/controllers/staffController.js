const Staff = require('../models/staff')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')


const createStaff = async (req, res) => {
  try {
    const { username, email, password, tel, role, full_name } = req.body;

    // Validate common fields
    if (!tel || !role || !full_name) {
      return res.status(400).json({ message: "Phone, role, and full name are required" });
    }

    // --- Generate defaults for driver/field_agent ---
    let staffUsername = username;
    let staffEmail = email;

    if (role === 'driver' || role === 'field_agent') {
      staffUsername = `${role}_${tel}_${Date.now()}`; // Unique username
      staffEmail = `no-email_${role}_${tel}@ecohaul.com`; // Unique email
    }

    // Check if role requires login credentials
    if (role !== 'driver' && role !== 'field_agent') {
      if (!username || !email || !password) {
        return res.status(400).json({
          message: "Username, email, and password are required for this role"
        });
      }

      // Check for existing staff with same username/email
      const existingStaff = await Staff.findOne({
        $or: [
          { username: staffUsername },
          { email: staffEmail }
        ]
      });

      if (existingStaff) {
        return res.status(400).json({
          message: existingStaff.username === staffUsername
            ? "User with this username already exists"
            : "User with this email already exists"
        });
      }

      // Hash password and create staff
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newStaff = new Staff({
        username: staffUsername,
        email: staffEmail,
        password: hashedPassword,
        tel,
        role,
        full_name
      });
      await newStaff.save();
      return res.status(201).json({ message: 'Staff account created successfully' });

    } else {
      // For driver/field_agent: Use generated defaults
      const newStaff = new Staff({
        username: staffUsername,
        email: staffEmail, // Now included (unique default)
        tel,
        role,
        full_name
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
    // accepting the user details 
    const { password, username } = req.body
    console.log(req.body)

    const existingStaff = await Staff.findOne({ username: username })

    if (!existingStaff) {
        return res.status(400).send('User does not exist or Username Incorrect')
    }

    const compare = await bcrypt.compare(password, existingStaff.password)

    if (compare === true) {

        const payload = {
            user: {
                id: existingStaff.id,
                role: existingStaff.role,
                full_name: existingStaff.full_name,
                tel: existingStaff.tel,
                username: existingStaff.username
            }
        }

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' },
            (error, token) => {
                if (error) { return res.status(400).send(error) }
                return res.status(200).json({ token })
            }

        )

    } else {
        return res.status(400).send('Incorrect Password')
    }




}


module.exports = {
    createStaff,
    loginStaff
}
