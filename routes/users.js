const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAdmin, noCache } = require('../middleware/auth');
const { validateUserCreate, validateUserUpdate, sanitizeInput } = require('../middleware/validation');

// List all users
router.get('/', isAdmin, noCache, userController.index);

// Create user
router.get('/create', isAdmin, noCache, userController.create);
router.post('/create', isAdmin, sanitizeInput, validateUserCreate, userController.store);

// Edit user
router.get('/edit/:id', isAdmin, noCache, userController.edit);
router.post('/edit/:id', isAdmin, sanitizeInput, validateUserUpdate, userController.update);

// Delete user
router.post('/delete/:id', isAdmin, userController.delete);
router.get('/delete/:id', isAdmin, userController.delete);

// View user detail
router.get('/:id', isAdmin, noCache, userController.show);

module.exports = router;