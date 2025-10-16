const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} = require('../controllers/customerController');
const auth = require('../middleware/auth');

// Get all customers
router.get('/all', auth, getAllCustomers);

// Get single customer by ID
router.get('/:id', auth, getCustomerById);

// Create new customer (CEO only)
router.post('/create', auth, createCustomer);

// Update customer (CEO only)
router.put('/:id', auth, updateCustomer);

// Delete customer (CEO only)
router.delete('/:id', auth, deleteCustomer);

module.exports = router;