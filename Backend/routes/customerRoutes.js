const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomersByStreet,
  getAssignedCustomers,
} = require('../controllers/customerController');
const auth = require('../middleware/auth');

// Get all customers
router.get('/all', auth, getAllCustomers);

// Get customers assigned to supervisor's routes
router.get('/assigned', auth, getAssignedCustomers);

// Get single customer by ID
router.get('/:id', auth, getCustomerById);

// Get customers by street ID
router.get('/by-street/:streetId', auth, getCustomersByStreet);

// Create new customer (Manager only)
router.post('/create', auth, createCustomer);

// Update customer (Manager only)
router.put('/:id', auth, updateCustomer);

// Delete customer (Manager only)
router.delete('/:id', auth, deleteCustomer);

module.exports = router;