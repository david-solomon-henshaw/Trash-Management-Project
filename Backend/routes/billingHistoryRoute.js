// routes/billingHistoryRoutes.js
const express = require('express');
const router = express.Router();
const billingHistoryController = require('../controllers/billingHistoryController');
const auth = require('../middleware/auth');

// Search customers for billing history
router.get('/search', auth, billingHistoryController.searchCustomers);

// Get complete billing history for a customer
router.get('/customer/:customerId', auth, billingHistoryController.getCustomerBillingHistory);

// Get single payment details
router.get('/payment/:paymentId', auth, billingHistoryController.getPaymentDetails);

module.exports = router;