// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Get complete dashboard data
router.get('/', dashboardController.getDashboardData);

// Get only metrics (for quick updates)
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await dashboardController.getPerformanceMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get only live operations (for real-time updates)
router.get('/live-operations', async (req, res) => {
  try {
    const operations = await dashboardController.getLiveOperations();
    res.json({ success: true, data: operations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;