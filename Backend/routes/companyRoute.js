const express = require('express')
const router = express.Router()
const {registerAll} = require('../controllers/companyController')

router.post('/register-all', registerAll)

module.exports = router