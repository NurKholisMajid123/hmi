const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isGuest } = require('../middleware/auth');
const { sanitizeInput, validateLogin } = require('../middleware/validation');

// Login routes
router.get('/login', isGuest, authController.showLogin);
router.post('/login', isGuest, sanitizeInput, validateLogin, authController.login);

// Logout routes
router.get('/logout', authController.logout);
router.post('/logout', authController.logout);

module.exports = router;