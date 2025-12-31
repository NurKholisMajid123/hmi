const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');

// Halaman utama - TANPA layout
router.get('/', (req, res) => {
    res.render('index', { 
        title: 'Home',
        layout: false // Tidak pakai layout
    });
});

// Dashboard - Pakai layout dashboard
router.get('/dashboard', authRoutes.requireAuth, (req, res) => {
    res.render('dashboard', { 
        title: 'Dashboard',
        activePage: 'dashboard',
        layout: 'layouts/dashboard', // Pakai layout dashboard
        user: req.session.user
    });
});

module.exports = router;