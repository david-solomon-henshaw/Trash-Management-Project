const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// ==================== MANAGER DASHBOARD ROUTES ====================

// GET /api/analytics/dashboard-metrics - Main dashboard metrics
router.get('/dashboard-metrics', analyticsController.getDashboardMetrics);

// GET /api/analytics/live-operations - Live routes data
router.get('/live-operations', analyticsController.getLiveOperations);

// GET /api/analytics/route-analytics - Route statistics
router.get('/route-analytics', analyticsController.getRouteAnalytics);

// ==================== CUSTOMER ANALYTICS ROUTES ====================

// GET /api/analytics/customer-overview - Customer counts overview
router.get('/customer-overview', analyticsController.getCustomerOverview);

// GET /api/analytics/customer-growth - Customer growth trend
router.get('/customer-growth', analyticsController.getCustomerGrowth);

// ==================== FINANCIAL ANALYTICS ROUTES ====================

// GET /api/analytics/revenue-trend - Revenue over time
router.get('/revenue-trend', analyticsController.getRevenueTrend);

// GET /api/analytics/agent-performance - Staff performance
router.get('/agent-performance', analyticsController.getAgentPerformance);

// ==================== LEGACY/COMPATIBILITY ROUTES (Optional - Remove if not needed) ====================

// GET /api/analytics/customers/overview (legacy route)
router.get('/customers/overview', analyticsController.getCustomerOverview);

// GET /api/analytics/reports/revenue-trend (legacy route)
router.get('/reports/revenue-trend', analyticsController.getRevenueTrend);

// GET /api/analytics/reports/agent-performance (legacy route)
router.get('/reports/agent-performance', analyticsController.getAgentPerformance);

module.exports = router;