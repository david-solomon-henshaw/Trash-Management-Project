const express = require('express');
const router = express.Router();
const {
  getAllInstitutionalSubtypes,
  getInstitutionalSubtypeById,
  createInstitutionalSubtype,
  updateInstitutionalSubtype,
  deleteInstitutionalSubtype,
} = require('../controllers/institutionalSubtypeController');

// Middleware for authentication (you might have this in a separate file)
const auth = require('../middleware/auth'); // Adjust path as needed

// @route   GET /api/institutional-subtypes
// @desc    Get all institutional subtypes
// @access  Public (or Private based on your requirements)
router.get('/', auth, getAllInstitutionalSubtypes);

// @route   GET /api/institutional-subtypes/:id
// @desc    Get institutional subtype by ID
// @access  Public (or Private based on your requirements)
router.get('/:id', auth, getInstitutionalSubtypeById);

// @route   POST /api/institutional-subtypes
// @desc    Create a new institutional subtype
// @access  Private (Admin only)
router.post('/', auth, createInstitutionalSubtype);

// @route   PUT /api/institutional-subtypes/:id
// @desc    Update an institutional subtype
// @access  Private (Admin only)
router.put('/:id', auth, updateInstitutionalSubtype);

// @route   DELETE /api/institutional-subtypes/:id
// @desc    Delete an institutional subtype
// @access  Private (Admin only)
router.delete('/:id', auth, deleteInstitutionalSubtype);

module.exports = router;