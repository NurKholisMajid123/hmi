const express = require('express');
const router = express.Router();
const Bidang = require('../models/Bidang');
const { isAuthenticated, noCache } = require('../middleware/auth');

// View bidang yang diikuti user
router.get('/', isAuthenticated, noCache, async (req, res) => {
    try {
        const userId = req.session.userId;
        const myBidang = await Bidang.getUserBidang(userId);
        
        res.render('my-bidang/index', {
            title: 'Bidang Saya',
            subtitle: 'Daftar bidang yang Anda ikuti',
            layout: 'layouts/dashboard',
            activeMenu: 'bidang-saya',
            myBidang
        });
    } catch (error) {
        console.error('Error fetching my bidang:', error);
        res.status(500).send('Terjadi kesalahan');
    }
});

// View detail bidang (read-only untuk anggota)
router.get('/:id', isAuthenticated, noCache, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;
        const roleLevel = req.session.roleLevel;

        const bidang = await Bidang.findById(id);
        if (!bidang) {
            return res.status(404).render('errors/404', {
                title: 'Tidak Ditemukan',
                message: 'Bidang tidak ditemukan',
                user: req.session,
                layout: 'layouts/dashboard'
            });
        }

        const isAdminOrKetuaUmum = roleLevel === 1 || roleLevel === 2;
        
        // Cek apakah user adalah ketua bidang ini (roleLevel 5) - DIPERBAIKI
        const isKetuaBidang = roleLevel === 5 && bidang.ketua_bidang_id == userId;
        
        // Cek apakah user adalah anggota bidang ini (roleLevel 6)
        const isAnggota = roleLevel === 6 && await Bidang.isAnggotaOf(userId, id);

        if (!isAdminOrKetuaUmum && !isKetuaBidang && !isAnggota) {
            return res.status(403).render('errors/403', {
                title: 'Akses Ditolak',
                message: 'Anda tidak terdaftar sebagai anggota atau ketua bidang ini',
                user: req.session,
                layout: 'layouts/dashboard'
            });
        }

        const anggota = await Bidang.getAnggota(id);
        
        res.render('my-bidang/detail', {
            title: bidang.nama_bidang,
            subtitle: 'Detail bidang',
            layout: 'layouts/dashboard',
            activeMenu: 'bidang-saya',
            bidang,
            anggota,
            isKetuaBidang
        });
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/my-bidang?error=Terjadi kesalahan');
    }
});

module.exports = router;