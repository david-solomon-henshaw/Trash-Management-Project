const express = require('express');
const router = express.Router();
const { 
  createTruck, 
  assignRouteToTruck, 
  getAllTrucks, 
  getAllSupervisorAssignments,
  startAssignment, // Add this import
  getActiveRoutes
} = require('../controllers/truckController');
const auth = require('../middleware/auth');

// Manager only routes
router.post('/create', auth, createTruck);
router.post('/assign-route', auth, assignRouteToTruck);
router.get('/', auth, getAllTrucks);

// Supervisor routes
router.get('/active-routes', auth, getActiveRoutes);
router.get('/all-assignments', auth, getAllSupervisorAssignments);
router.post('/start-assignment', auth, startAssignment); // Add this route

module.exports = router;