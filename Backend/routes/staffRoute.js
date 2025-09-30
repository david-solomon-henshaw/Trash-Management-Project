const express = require('express')
const router = express.Router()
const {createStaff, loginStaff, getAllStaff} = require('../controllers/staffController')

router.post('/signup',createStaff)
router.post('/signin',loginStaff)
router.get('/',getAllStaff)


module.exports = router