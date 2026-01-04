// routes/departemen.js
const express = require('express');
const router = express.Router();
const DepartemenAnggota = require('../models/DepartemenAnggota');
const User = require('../models/User');
const { isAuthenticated, noCache } = require('../middleware/auth');

// Middleware untuk cek akses sekretaris
const isSekretarisOrAdmin = (req, res, next) => {
    const roleLevel = req.session.roleLevel;
    
    // Admin (1), Ketua Umum (2), atau Sekretaris (3)
    if (roleLevel === 1 || roleLevel === 2 || roleLevel === 3) {
        return next();
    }

    return res.status(403).render('errors/403', {
        title: 'Akses Ditolak',
        message: 'Anda tidak memiliki akses ke halaman ini',
        user: req.session,
        layout: 'layouts/dashboard'
    });
};

// Middleware untuk cek akses bendahara
const isBendaharaOrAdmin = (req, res, next) => {
    const roleLevel = req.session.roleLevel;
    
    // Admin (1), Ketua Umum (2), atau Bendahara (4)
    if (roleLevel === 1 || roleLevel === 2 || roleLevel === 4) {
        return next();
    }

    return res.status(403).render('errors/403', {
        title: 'Akses Ditolak',
        message: 'Anda tidak memiliki akses ke halaman ini',
        user: req.session,
        layout: 'layouts/dashboard'
    });
};

// ==================== SEKRETARIS ====================

// View anggota sekretaris
router.get('/sekretaris/anggota', isAuthenticated, isSekretarisOrAdmin, noCache, async (req, res) => {
    try {
        const anggota = await DepartemenAnggota.getAnggotaSekretaris();
        
        // Get ONLY available users (yang belum terdaftar di manapun)
        const availableUsers = await DepartemenAnggota.getAvailableUsers();

        res.render('departemen/sekretaris-anggota', {
            title: 'Anggota Sekretaris',
            subtitle: 'Manajemen anggota sekretaris',
            layout: 'layouts/dashboard',
            activeMenu: 'sekretaris',
            anggota,
            availableUsers,
            query: req.query
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Terjadi kesalahan');
    }
});

// Add anggota sekretaris
router.post('/sekretaris/anggota/add', isAuthenticated, isSekretarisOrAdmin, async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.redirect('/departemen/sekretaris/anggota?error=Pilih anggota terlebih dahulu');
        }

        // Validasi akan dilakukan di model
        await DepartemenAnggota.addAnggotaSekretaris(user_id);
        res.redirect('/departemen/sekretaris/anggota?success=Anggota berhasil ditambahkan');
    } catch (error) {
        console.error('Error adding anggota sekretaris:', error);
        
        // Handle specific error message
        if (error.message.includes('sudah menjadi anggota')) {
            return res.redirect(`/departemen/sekretaris/anggota?error=${encodeURIComponent(error.message)}`);
        }
        
        res.redirect('/departemen/sekretaris/anggota?error=Gagal menambahkan anggota');
    }
});

// Remove anggota sekretaris
router.post('/sekretaris/anggota/remove/:user_id', isAuthenticated, isSekretarisOrAdmin, async (req, res) => {
    try {
        const { user_id } = req.params;
        await DepartemenAnggota.removeAnggotaSekretaris(user_id);
        res.redirect('/departemen/sekretaris/anggota?success=Anggota berhasil dihapus');
    } catch (error) {
        console.error('Error removing anggota sekretaris:', error);
        res.redirect('/departemen/sekretaris/anggota?error=Gagal menghapus anggota');
    }
});

// ==================== BENDAHARA ====================

// View anggota bendahara
router.get('/bendahara/anggota', isAuthenticated, isBendaharaOrAdmin, noCache, async (req, res) => {
    try {
        const anggota = await DepartemenAnggota.getAnggotaBendahara();
        
        // Get ONLY available users (yang belum terdaftar di manapun)
        const availableUsers = await DepartemenAnggota.getAvailableUsers();

        res.render('departemen/bendahara-anggota', {
            title: 'Anggota Bendahara',
            subtitle: 'Manajemen anggota bendahara',
            layout: 'layouts/dashboard',
            activeMenu: 'bendahara',
            anggota,
            availableUsers,
            query: req.query
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Terjadi kesalahan');
    }
});

// Add anggota bendahara
router.post('/bendahara/anggota/add', isAuthenticated, isBendaharaOrAdmin, async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.redirect('/departemen/bendahara/anggota?error=Pilih anggota terlebih dahulu');
        }

        // Validasi akan dilakukan di model
        await DepartemenAnggota.addAnggotaBendahara(user_id);
        res.redirect('/departemen/bendahara/anggota?success=Anggota berhasil ditambahkan');
    } catch (error) {
        console.error('Error adding anggota bendahara:', error);
        
        // Handle specific error message
        if (error.message.includes('sudah menjadi anggota')) {
            return res.redirect(`/departemen/bendahara/anggota?error=${encodeURIComponent(error.message)}`);
        }
        
        res.redirect('/departemen/bendahara/anggota?error=Gagal menambahkan anggota');
    }
});

// Remove anggota bendahara
router.post('/bendahara/anggota/remove/:user_id', isAuthenticated, isBendaharaOrAdmin, async (req, res) => {
    try {
        const { user_id } = req.params;
        await DepartemenAnggota.removeAnggotaBendahara(user_id);
        res.redirect('/departemen/bendahara/anggota?success=Anggota berhasil dihapus');
    } catch (error) {
        console.error('Error removing anggota bendahara:', error);
        res.redirect('/departemen/bendahara/anggota?error=Gagal menghapus anggota');
    }
});

module.exports = router;