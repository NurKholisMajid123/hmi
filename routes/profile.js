const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, noCache } = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');

// View own profile
router.get('/', isAuthenticated, noCache, userController.profile);

// Update own profile
router.post('/update', isAuthenticated, sanitizeInput, async (req, res) => {
    try {
        const User = require('../models/User');
        const { full_name, phone, address, email } = req.body;

        // Validasi
        if (!full_name || !email) {
            return res.redirect('/profile?error=Nama dan email harus diisi');
        }

        // Check if email already used by other user
        const existingUser = await User.findByEmail(email);
        if (existingUser && existingUser.id !== req.session.userId) {
            return res.redirect('/profile?error=Email sudah digunakan user lain');
        }

        // Update data tanpa mengubah role
        await User.update(req.session.userId, {
            username: req.session.username, // Keep username
            email,
            full_name,
            phone: phone || null,
            address: address || null,
            role_id: req.session.roleId, // Keep the same role
            is_active: true // Keep active
        });

        // Update session
        req.session.fullName = full_name;

        res.redirect('/profile?success=Profil berhasil diperbarui');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.redirect('/profile?error=Gagal memperbarui profil');
    }
});

// Change password
router.post('/change-password', isAuthenticated, async (req, res) => {
    try {
        const User = require('../models/User');
        const { current_password, new_password, confirm_password } = req.body;

        // Validasi
        if (!current_password || !new_password || !confirm_password) {
            return res.redirect('/profile?error=Semua field password harus diisi');
        }

        if (new_password !== confirm_password) {
            return res.redirect('/profile?error=Password baru tidak cocok');
        }

        if (new_password.length < 6) {
            return res.redirect('/profile?error=Password minimal 6 karakter');
        }

        // Verify current password
        const user = await User.findById(req.session.userId);
        const isValid = await User.verifyPassword(current_password, user.password);

        if (!isValid) {
            return res.redirect('/profile?error=Password lama salah');
        }

        // Update password
        await User.updatePassword(req.session.userId, new_password);
        res.redirect('/profile?success=Password berhasil diubah');

    } catch (error) {
        console.error('Error changing password:', error);
        res.redirect('/profile?error=Gagal mengubah password');
    }
});

module.exports = router;