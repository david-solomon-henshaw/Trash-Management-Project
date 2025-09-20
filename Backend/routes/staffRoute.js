const express = require('express')
const router = express.Router()
const {createStaff, loginStaff} = require('../controllers/staffController')

router.post('/signup',createStaff)
router.post('/signin',loginStaff)


module.exports = router