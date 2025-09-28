const express = require('express')
const router = express.Router()
const {addStreet,getAllStreets} = require('../controllers/streetController')
const auth = require('../middleware/auth'); // Assuming you have auth middleware


router.post('/create', auth, addStreet)
router.get('/',getAllStreets)


module.exports = router