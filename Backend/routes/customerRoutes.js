const express = require('express');
const router = express.Router();
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomersByStreet,
} = require('../controllers/customerController');
const auth = require('../middleware/auth');

// Get all customers
router.get('/all', auth, getAllCustomers);

// Get single customer by ID
router.get('/:id', auth, getCustomerById);

// Get customers by street ID
router.get('/by-street/:streetId', auth, getCustomersByStreet);

// Create new customer (CEO only)
router.post('/create', auth, createCustomer);

// Update customer (CEO only)
router.put('/:id', auth, updateCustomer);

// Delete customer (CEO only)
router.delete('/:id', auth, deleteCustomer);

module.exports = router;