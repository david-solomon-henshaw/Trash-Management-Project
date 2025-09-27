const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { createTruck } = require('../controllers/truckController');

router.post('/create', authMiddleware, createTruck);

module.exports = router;