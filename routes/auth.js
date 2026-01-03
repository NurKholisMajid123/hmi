const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isGuest } = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');

// Show login page
router.get('/login', isGuest, (req, res) => {
  res.render('auth/login', {
    title: 'Login',
    error: null,
  });
});

// Process login
router.post('/login', isGuest, sanitizeInput, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validasi input
    if (!username || !password) {
      return res.render('auth/login', {
        title: 'Login',
        error: 'Username dan password harus diisi'
      });
    }

    // Cari user
    const user = await User.findByUsername(username);
    if (!user) {
      return res.render('auth/login', {
        title: 'Login',
        error: 'Username atau password salah'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.render('auth/login', {
        title: 'Login',
        error: 'Akun Anda tidak aktif'
      });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.render('auth/login', {
        title: 'Login',
        error: 'Username atau password salah'
      });
    }

    // Set session
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.fullName = user.full_name;
    req.session.roleId = user.role_id;
    req.session.roleName = user.role_name;
    req.session.roleLevel = user.role_level;

    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', {
      title: 'Login',
      error: 'Terjadi kesalahan, silakan coba lagi'
    });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

module.exports = router;