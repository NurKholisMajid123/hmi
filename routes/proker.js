const express = require('express');
const router = express.Router();
const ProgramKerja = require('../models/ProgramKerja');
const Bidang = require('../models/Bidang');
const User = require('../models/User');
const { isAuthenticated, noCache } = require('../middleware/auth');
const { sanitizeInput } = require('../middleware/validation');
const {
    canCreateProker,
    canReadProker,
    canUpdateProker,
    canDeleteProker,
    canApproveProker
} = require('../middleware/prokerPermission');

// List all proker (filtered by role)
router.get('/', isAuthenticated, noCache, async (req, res) => {
    try {
        const userId = req.session.userId;
        const roleLevel = req.session.roleLevel;
        const { status, kategori_id } = req.query;

        // Get bidang user jika ketua bidang atau anggota
        let bidangId = null;
        if (roleLevel === 5) {
            const bidang = await Bidang.findByKetuaId(userId);
            bidangId = bidang ? bidang.id : null;
        } else if (roleLevel === 6) {
            const bidangList = await Bidang.getUserBidang(userId);
            bidangId = bidangList.length > 0 ? bidangList[0].id : null;
        }

        // Get proker berdasarkan role
        let prokerList = await ProgramKerja.findByRole(userId, roleLevel, bidangId);

        // Apply additional filters
        if (status) {
            prokerList = prokerList.filter(p => p.status === status);
        }
        if (kategori_id) {
            prokerList = prokerList.filter(p => p.kategori_id === parseInt(kategori_id));
        }

        // Get data untuk filter
        const kategoriList = await ProgramKerja.getKategori();
        const bidangList = await Bidang.findAll();

        res.render('proker/index', {
            title: 'Program Kerja',
            subtitle: 'Manajemen program kerja organisasi',
            layout: 'layouts/dashboard',
            activeMenu: 'proker',
            prokerList,
            kategoriList,
            bidangList,
            query: req.query
        });
    } catch (error) {
        console.error('Error fetching proker:', error);
        res.status(500).send('Terjadi kesalahan');
    }
});

// Show create form
router.get('/create', isAuthenticated, canCreateProker, noCache, async (req, res) => {
    try {
        const userId = req.session.userId;
        const roleLevel = req.session.roleLevel;

        const kategoriList = await ProgramKerja.getKategori();
        const bidangList = await Bidang.findAll();

        // Determine kategori berdasarkan role
        let defaultKategori = null;
        let kategoriOptions = kategoriList;

        if (roleLevel === 3) { // Sekretaris
            kategoriOptions = kategoriList.filter(k => k.nama_kategori === 'Sekretaris');
            defaultKategori = kategoriOptions[0]?.id;
        } else if (roleLevel === 4) { // Bendahara
            kategoriOptions = kategoriList.filter(k => k.nama_kategori === 'Bendahara');
            defaultKategori = kategoriOptions[0]?.id;
        } else if (roleLevel === 5 || roleLevel === 6) { // Ketua Bidang atau Anggota
            kategoriOptions = kategoriList.filter(k => k.nama_kategori === 'Bidang');
            defaultKategori = kategoriOptions[0]?.id;
        }

        // Get users for penanggung jawab
        const users = await User.findAll();

        res.render('proker/create', {
            title: 'Tambah Program Kerja',
            subtitle: 'Form untuk menambahkan program kerja baru',
            layout: 'layouts/dashboard',
            activeMenu: 'proker',
            kategoriList: kategoriOptions,
            bidangList,
            users,
            defaultKategori,
            error: null
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Terjadi kesalahan');
    }
});

// Store new proker
router.post('/create', isAuthenticated, canCreateProker, sanitizeInput, async (req, res) => {
    const {
        judul, deskripsi, kategori_id, bidang_id, tanggal_mulai,
        tanggal_selesai, anggaran, penanggung_jawab_id, status
    } = req.body;

    const userId = req.session.userId;

    try {
        if (!judul || !kategori_id || !penanggung_jawab_id) {
            return res.redirect('/proker/create?error=Field wajib harus diisi');
        }

        await ProgramKerja.create({
            judul,
            deskripsi,
            kategori_id,
            bidang_id: bidang_id || null,
            tanggal_mulai,
            tanggal_selesai,
            anggaran,
            penanggung_jawab_id,
            pengusul_id: userId,
            status: status || 'draft'
        });

        res.redirect('/proker?success=Program kerja berhasil ditambahkan');
    } catch (error) {
        console.error('Error creating proker:', error);
        res.redirect('/proker/create?error=Gagal menambahkan program kerja');
    }
});

// Show detail proker
router.get('/:id', isAuthenticated, canReadProker, noCache, async (req, res) => {
    try {
        const { id } = req.params;
        const proker = await ProgramKerja.findById(id);
        const history = await ProgramKerja.getHistory(id);

        res.render('proker/detail', {
            title: proker.judul,
            subtitle: 'Detail program kerja',
            layout: 'layouts/dashboard',
            activeMenu: 'proker',
            proker,
            history,
            query: req.query
        });
    } catch (error) {
        console.error('Error:', error);
        res.redirect('/proker?error=Terjadi kesalahan');
    }
});

// Show edit form
router.get('/edit/:id', isAuthenticated, canUpdateProker, noCache, async (req, res) => {
    try {
        const { id } = req.params;
        const proker = await ProgramKerja.findById(id);
        const kategoriList = await ProgramKerja.getKategori();
        const bidangList = await Bidang.findAll();
        const users = await User.findAll();

        res.render('proker/edit', {
            title: 'Edit Program Kerja',
            subtitle: `Ubah data program kerja ${proker.judul}`,
            layout: 'layouts/dashboard',
            activeMenu: 'proker',
            proker,
            kategoriList,
            bidangList,
            users,
            error: null
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Terjadi kesalahan');
    }
});

// Update proker
router.post('/edit/:id', isAuthenticated, canUpdateProker, sanitizeInput, async (req, res) => {
    const { id } = req.params;
    const {
        judul, deskripsi, kategori_id, bidang_id, tanggal_mulai,
        tanggal_selesai, anggaran, penanggung_jawab_id, status
    } = req.body;

    try {
        if (!judul || !kategori_id || !penanggung_jawab_id) {
            return res.redirect(`/proker/edit/${id}?error=Field wajib harus diisi`);
        }

        const oldProker = await ProgramKerja.findById(id);

        await ProgramKerja.update(id, {
            judul,
            deskripsi,
            kategori_id,
            bidang_id: bidang_id || null,
            tanggal_mulai,
            tanggal_selesai,
            anggaran,
            penanggung_jawab_id,
            status: status || oldProker.status
        });

        // Add history if status changed
        if (status && status !== oldProker.status) {
            await ProgramKerja.addHistory(
                id,
                oldProker.status,
                status,
                req.session.userId,
                'Status diubah melalui form edit'
            );
        }

        res.redirect('/proker?success=Program kerja berhasil diupdate');
    } catch (error) {
        console.error('Error updating proker:', error);
        res.redirect(`/proker/edit/${id}?error=Gagal mengupdate program kerja`);
    }
});

// Delete proker
router.post('/delete/:id', isAuthenticated, canDeleteProker, async (req, res) => {
    try {
        const { id } = req.params;
        await ProgramKerja.delete(id);
        res.redirect('/proker?success=Program kerja berhasil dihapus');
    } catch (error) {
        console.error('Error deleting proker:', error);
        res.redirect('/proker?error=Gagal menghapus program kerja');
    }
});

// Approve proker
router.post('/:id/approve', isAuthenticated, canApproveProker, async (req, res) => {
    try {
        const { id } = req.params;
        const { action, catatan } = req.body;
        const userId = req.session.userId;

        const oldProker = await ProgramKerja.findById(id);
        const newStatus = action === 'approve' ? 'disetujui' : 'ditolak';

        await ProgramKerja.updateStatus(id, newStatus, userId, catatan);

        // Add history
        await ProgramKerja.addHistory(
            id,
            oldProker.status,
            newStatus,
            userId,
            catatan
        );

        const message = action === 'approve' ? 'disetujui' : 'ditolak';
        res.redirect(`/proker/${id}?success=Program kerja berhasil ${message}`);
    } catch (error) {
        console.error('Error approving proker:', error);
        res.redirect(`/proker/${req.params.id}?error=Gagal memproses approval`);
    }
});

// Submit proker for approval
router.post('/:id/submit', isAuthenticated, canUpdateProker, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;

        const oldProker = await ProgramKerja.findById(id);

        if (oldProker.status !== 'draft') {
            return res.redirect(`/proker/${id}?error=Hanya proker dengan status draft yang bisa diajukan`);
        }

        await ProgramKerja.updateStatus(id, 'diajukan');

        // Add history
        await ProgramKerja.addHistory(
            id,
            'draft',
            'diajukan',
            userId,
            'Proker diajukan untuk approval'
        );

        res.redirect(`/proker/${id}?success=Program kerja berhasil diajukan`);
    } catch (error) {
        console.error('Error submitting proker:', error);
        res.redirect(`/proker/${req.params.id}?error=Gagal mengajukan proker`);
    }
});

module.exports = router;