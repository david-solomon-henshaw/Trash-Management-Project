const express = require('express')
const router = express.Router()
const {createStaff, loginStaff, getAllStaff} = require('../controllers/staffController')
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per window
    message: 'Too many login attempts, please try again after 15 minutes'
});


router.post('/signup',createStaff)
router.post('/signin',loginLimiter,loginStaff)
router.get('/', auth, getAllStaff)


module.exports = router