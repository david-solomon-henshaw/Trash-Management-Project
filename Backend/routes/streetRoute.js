const express = require('express');
const router = express.Router();
const {
  addStreet,
  getAllStreets,
  getStreetById,
  updateStreet,
  deleteStreet
} = require('../controllers/streetController');
const auth = require('../middleware/auth'); // Assuming you have auth middleware

// Create a new street (Admin only)
router.post('/create', auth, addStreet);

// Get all streets
router.get('/all', auth, getAllStreets);

// Get single street by ID
router.get('/:id', auth, getStreetById);

// Update street (Admin only)
router.put('/:id', auth, updateStreet);

// Delete street (Admin only)
router.delete('/:id', auth, deleteStreet);

module.exports = router;