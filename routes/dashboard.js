const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated, noCache } = require('../middleware/auth');

// Dashboard
router.get('/', isAuthenticated, noCache, dashboardController.index);

module.exports = router;