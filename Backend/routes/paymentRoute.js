const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPaymentsByCustomer,
  verifyPayment,
  getPaymentSummary, 
  cancelPayment,
} = require('../controllers/paymentController');
const auth = require('../middleware/auth');

// Create payment
router.post('/', auth, createPayment);

// Get payments by customer
router.get('/customer/:customerId', auth, getPaymentsByCustomer);

// Get payment summary for a customer (NEW - needed for the enhanced UI)
router.get('/summary/:customerId', auth, getPaymentSummary);

// Verify payment (for transfer payments)
router.put('/verify/:paymentId', auth, verifyPayment);

// Cancel/Delete payment (CEO only)
router.delete('/:paymentId', auth, cancelPayment);

module.exports = router;