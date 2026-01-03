const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAuthenticated, noCache } = require('../middleware/auth');

// Dashboard
router.get('/', isAuthenticated, noCache, async (req, res) => {
  try {
    // Get statistics
    const allUsers = await User.findAll();
    const activeUsers = allUsers.filter(u => u.is_active);
    const stats = {
      totalUsers: allUsers.length,
      activeUsers: activeUsers.length,
      admins: allUsers.filter(u => u.role_level === 1).length,
      members: allUsers.filter(u => u.role_level === 5).length
    };

    res.render('dashboard/index', {
      title: 'Dashboard',
      layout: 'layouts/dashboard',
      activeMenu: 'dashboard',
      hideBreadcrumb: true,
      stats
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Terjadi kesalahan');
  }
});

module.exports = router;