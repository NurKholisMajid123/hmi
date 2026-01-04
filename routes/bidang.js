const express = require('express');
const router = express.Router();
const Bidang = require('../models/Bidang');
const User = require('../models/User');
const { isAdmin, isKetuaBidang, noCache } = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');

// Middleware untuk cek apakah user adalah ketua dari bidang tertentu
const isKetuaOfBidang = async (req, res, next) => {
    const bidangId = req.params.id || req.params.bidang_id;
    const userId = req.session.userId;
    const roleLevel = req.session.roleLevel;

    try {
        // Admin dan Ketua Umum bisa akses semua
        if (roleLevel === 1 || roleLevel === 2) {
            return next();
        }

        // Untuk Ketua Bidang (roleLevel 5) - DIPERBAIKI dari 4 ke 5
        if (roleLevel === 5) {
            const bidang = await Bidang.findById(bidangId);

            if (!bidang) {
                return res.status(404).render('errors/404', {
                    title: 'Tidak Ditemukan',
                    message: 'Bidang tidak ditemukan',
                    user: req.session,
                    layout: 'layouts/dashboard'
                });
            }

            // Gunakan loose comparison (==) untuk handle type mismatch
            if (bidang.ketua_bidang_id == userId) {
                return next();
            }

            return res.status(403).render('errors/403', {
                title: 'Akses Ditolak',
                message: 'Anda hanya bisa mengelola bidang yang Anda pimpin',
                user: req.session,
                layout: 'layouts/dashboard'
            });
        }

        // Untuk role lainnya (Anggota, dll) - tidak punya akses
        return res.status(403).render('errors/403', {
            title: 'Akses Ditolak',
            message: 'Anda tidak memiliki akses ke halaman ini',
            user: req.session,
            layout: 'layouts/dashboard'
        });
    } catch (error) {
        console.error('Error in isKetuaOfBidang middleware:', error);
        return res.status(500).render('errors/500', {
            title: 'Terjadi Kesalahan',
            message: 'Terjadi kesalahan saat memverifikasi akses',
            user: req.session,
            layout: 'layouts/dashboard'
        });
    }
};

// List all bidang
router.get('/', isKetuaBidang, noCache, async (req, res) => {
    try {
        const bidangList = await Bidang.findAll();

        res.render('bidang/index', {
            title: 'Daftar Bidang',
            subtitle: 'Manajemen bidang organisasi',
            layout: 'layouts/dashboard',
            activeMenu: 'bidang',
            bidangList,
            query: req.query
        });
    } catch (error) {
        console.error('Error fetching bidang:', error);
        res.status(500).send('Terjadi kesalahan');
    }
});

// Show create form - Admin only
router.get('/create', isAdmin, noCache, async (req, res) => {
    try {
        const ketuaBidangUsers = await User.findByRole(5);

        res.render('bidang/create', {
            title: 'Tambah Bidang',
            subtitle: 'Form untuk menambahkan bidang baru',
            layout: 'layouts/dashboard',
            activeMenu: 'bidang',
            ketuaBidangUsers,
            error: null
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Terjadi kesalahan');
    }
});

// Store new bidang - Admin only
router.post('/create', isAdmin, sanitizeInput, async (req, res) => {
    const { nama_bidang, deskripsi, ketua_bidang_id } = req.body;

    try {
        if (!nama_bidang) {
            const ketuaBidangUsers = await User.findByRole(5);
            return res.render('bidang/create', {
                title: 'Tambah Bidang',
                subtitle: 'Form untuk menambahkan bidang baru',
                layout: 'layouts/dashboard',
                activeMenu: 'bidang',
                ketuaBidangUsers,
                error: 'Nama bidang wajib diisi'
            });
        }

        await Bidang.create({ nama_bidang, deskripsi, ketua_bidang_id: ketua_bidang_id || null });
        res.redirect('/bidang?success=Bidang berhasil ditambahkan');
    } catch (error) {
        console.error('Error creating bidang:', error);
        res.redirect('/bidang/create?error=Gagal menambahkan bidang');
    }
});

// Show edit form - Admin only
router.get('/edit/:id', isAdmin, noCache, async (req, res) => {
    try {
        const { id } = req.params;
        const bidang = await Bidang.findById(id);
        const ketuaBidangUsers = await User.findByRole(5);

        if (!bidang) {
            return res.redirect('/bidang?error=Bidang tidak ditemukan');
        }

        res.render('bidang/edit', {
            title: 'Edit Bidang',
            subtitle: `Ubah data bidang ${bidang.nama_bidang}`,
            layout: 'layouts/dashboard',
            activeMenu: 'bidang',
            bidang,
            ketuaBidangUsers,
            error: null
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Terjadi kesalahan');
    }
});

// Update bidang - Admin only
router.post('/edit/:id', isAdmin, sanitizeInput, async (req, res) => {
    const { id } = req.params;
    const { nama_bidang, deskripsi, ketua_bidang_id } = req.body;

    try {
        if (!nama_bidang) {
            return res.redirect(`/bidang/edit/${id}?error=Nama bidang wajib diisi`);
        }

        await Bidang.update(id, { nama_bidang, deskripsi, ketua_bidang_id: ketua_bidang_id || null });
        res.redirect('/bidang?success=Bidang berhasil diupdate');
    } catch (error) {
        console.error('Error updating bidang:', error);
        res.redirect(`/bidang/edit/${id}?error=Gagal mengupdate bidang`);
    }
});

// Delete bidang - Admin only
router.post('/delete/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await Bidang.delete(id);
        res.redirect('/bidang?success=Bidang berhasil dihapus');
    } catch (error) {
        console.error('Error deleting bidang:', error);
        res.redirect('/bidang?error=Gagal menghapus bidang');
    }
});

// View bidang detail & manage anggota
router.get('/:id/anggota', noCache, isKetuaOfBidang, async (req, res) => {
    try {
        const { id } = req.params;
        const bidang = await Bidang.findById(id);
        const anggota = await Bidang.getAnggota(id);

        // Get available users (Anggota role) yang belum terdaftar di bidang ini
        const allAnggota = await User.findByRole(6);
        const anggotaIds = anggota.map(a => a.id);
        const availableUsers = allAnggota.filter(u => !anggotaIds.includes(u.id));

        if (!bidang) {
            return res.redirect('/bidang?error=Bidang tidak ditemukan');
        }

        res.render('bidang/anggota', {
            title: `Anggota ${bidang.nama_bidang}`,
            subtitle: 'Manajemen anggota bidang',
            layout: 'layouts/dashboard',
            activeMenu: 'bidang',
            bidang,
            anggota,
            availableUsers,
            query: req.query
        });
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/bidang?error=Terjadi kesalahan');
    }
});

// Add anggota to bidang
router.post('/:id/anggota/add', isKetuaOfBidang, async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;

        if (!user_id) {
            return res.redirect(`/bidang/${id}/anggota?error=Pilih anggota terlebih dahulu`);
        }

        await Bidang.addAnggota(id, user_id);
        res.redirect(`/bidang/${id}/anggota?success=Anggota berhasil ditambahkan`);
    } catch (error) {
        console.error('Error adding anggota:', error);
        res.redirect(`/bidang/${req.params.id}/anggota?error=Gagal menambahkan anggota`);
    }
});

// Remove anggota from bidang
router.post('/:bidang_id/anggota/remove/:user_id', isKetuaOfBidang, async (req, res) => {
    try {
        const { bidang_id, user_id } = req.params;
        await Bidang.removeAnggota(bidang_id, user_id);
        res.redirect(`/bidang/${bidang_id}/anggota?success=Anggota berhasil dihapus`);
    } catch (error) {
        console.error('Error removing anggota:', error);
        res.redirect(`/bidang/${req.params.bidang_id}/anggota?error=Gagal menghapus anggota`);
    }
});

module.exports = router;