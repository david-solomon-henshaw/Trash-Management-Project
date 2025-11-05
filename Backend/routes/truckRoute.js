const express = require('express');
const router = express.Router();
const { 
  createTruck, 
  assignRouteToTruck, 
  getAllTrucks, 
  getSupervisorAssignments 
} = require('../controllers/truckController');
const auth = require('../middleware/auth');

// CEO only routes
router.post('/create', auth, createTruck);
router.post('/assign-route', auth, assignRouteToTruck);
router.get('/', auth, getAllTrucks);

// Supervisor routes
router.get('/assignments/my-assignments', auth, getSupervisorAssignments);

// NEW: Supervisor assignments route for frontend compatibility
router.get('/supervisor-assignments', auth, getSupervisorAssignments);

module.exports = router;