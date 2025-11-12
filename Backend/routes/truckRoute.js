const express = require('express');
const router = express.Router();
const { 
  createTruck, 
  assignRouteToTruck, 
  getAllTrucks, 
  getAllSupervisorAssignments,
  startAssignment,
  updateAssignmentStatus, // Add this import
  getActiveRoutes,
  updateRouteLocation,
  getSupervisorInProgressAssignment
} = require('../controllers/truckController');
const auth = require('../middleware/auth');

// Manager only routes
router.post('/create', auth, createTruck);
router.post('/assign-route', auth, assignRouteToTruck);
router.get('/', auth, getAllTrucks);

// Supervisor routes
router.get('/active-routes', auth, getActiveRoutes);
router.get('/all-assignments', auth, getAllSupervisorAssignments);
router.post('/start-assignment', auth, startAssignment);
router.post('/update-assignment-status', auth, updateAssignmentStatus); // Add this route
router.post('/update-route-location', auth, updateRouteLocation);
router.get('/my-assignments', auth, getSupervisorInProgressAssignment);

module.exports = router;