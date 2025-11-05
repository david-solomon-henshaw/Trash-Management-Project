const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// ==================== CUSTOMER ANALYTICS ROUTES ====================

// GET /api/analytics/customer-overview (NEW - for frontend compatibility)
router.get('/customer-overview', analyticsController.getCustomerOverview);

// GET /api/analytics/customers/overview
router.get('/customers/overview', analyticsController.getCustomerOverview);

// GET /api/analytics/revenue-overview (NEW - for frontend compatibility)
router.get('/revenue-overview', analyticsController.getRevenueOverview);

// GET /api/analytics/reports/revenue-overview
router.get('/reports/revenue-overview', analyticsController.getRevenueOverview);

// GET /api/analytics/customers/growth
router.get('/customers/growth', analyticsController.getCustomerGrowth);

// GET /api/analytics/customers/by-street
router.get('/customers/by-street', analyticsController.getCustomersByStreet);

// GET /api/analytics/customers/by-apartment-type
router.get('/customers/by-apartment-type', analyticsController.getCustomersByApartmentType);

// GET /api/analytics/customers/by-business-type
router.get('/customers/by-business-type', analyticsController.getCustomersByBusinessType);

// ==================== FINANCIAL REPORTS ROUTES ====================

// GET /api/analytics/reports/revenue-trend
router.get('/reports/revenue-trend', analyticsController.getRevenueTrend);

// GET /api/analytics/reports/revenue-by-street
router.get('/reports/revenue-by-street', analyticsController.getRevenueByStreet);

// GET /api/analytics/reports/revenue-by-customer-type
router.get('/reports/revenue-by-customer-type', analyticsController.getRevenueByCustomerType);

// GET /api/analytics/reports/payment-status
router.get('/reports/payment-status', analyticsController.getPaymentStatus);

// GET /api/analytics/reports/collection-rate
router.get('/reports/collection-rate', analyticsController.getCollectionRate);

// GET /api/analytics/reports/agent-performance
router.get('/reports/agent-performance', analyticsController.getAgentPerformance);

// GET /api/analytics/reports/outstanding-balances
router.get('/reports/outstanding-balances', analyticsController.getOutstandingBalances);

module.exports = router;