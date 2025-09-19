const Staff = require('../models/staff')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')


const createStaff = async (req, res) => {

    try {
        // Get all the neccessary fields from the user input
        const { username, email, password, tel, role, full_name } = req.body

        // Check if there is an existing user with that username exists
        const existingStaff = await Staff.findOne({username: username})

        //return a response if a existing 
        if (existingStaff) {
            console.log(existingStaff)
            return res.status(400).json({ message: "user with the same username already exists" })
        }
        
        // Hasing the password from the user
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // create the new user with the new password field
        const newStaff = new Staff({ username, email, password: hashedPassword, tel, role, full_name })
        await newStaff.save()

        const payload = {
            user: {
                id: newStaff.id,
                role: newStaff.role,
            }
        }

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1d' },
            (error, token) => {
                if (error) throw error
                res.status(201).json({ token })
            }

        )



    }

    catch (error) {
        console.error(error.message)
        res.status(500).send('Server error')
    }

}


module.exports = {
    createStaff
}
