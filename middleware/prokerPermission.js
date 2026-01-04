const ProgramKerja = require('../models/ProgramKerja');
const Bidang = require('../models/Bidang');
const DepartemenAnggota = require('../models/DepartemenAnggota');

// Check if user can create proker
const canCreateProker = async (req, res, next) => {
    const roleLevel = req.session.roleLevel;

    // Semua role bisa create proker (termasuk anggota sekretaris & bendahara)
    if (roleLevel >= 1 && roleLevel <= 6) {
        return next();
    }

    return res.status(403).render('errors/403', {
        title: 'Akses Ditolak',
        message: 'Anda tidak memiliki akses untuk membuat program kerja',
        user: req.session,
        layout: 'layouts/dashboard'
    });
};

// Check if user can read proker
const canReadProker = async (req, res, next) => {
    const prokerId = req.params.id;
    const userId = req.session.userId;
    const roleLevel = req.session.roleLevel;

    try {
        const proker = await ProgramKerja.findById(prokerId);

        if (!proker) {
            return res.status(404).render('errors/404', {
                title: 'Tidak Ditemukan',
                message: 'Program kerja tidak ditemukan',
                user: req.session,
                layout: 'layouts/dashboard'
            });
        }

        // Admin dan Ketua Umum bisa akses semua
        if (roleLevel === 1 || roleLevel === 2) {
            return next();
        }

        // Sekretaris - hanya kategori sekretaris
        if (roleLevel === 3 && proker.nama_kategori === 'Sekretaris') {
            return next();
        }

        // Bendahara - hanya kategori bendahara
        if (roleLevel === 4 && proker.nama_kategori === 'Bendahara') {
            return next();
        }

        // Ketua Bidang - hanya bidangnya
        if (roleLevel === 5) {
            const bidang = await Bidang.findByKetuaId(userId);
            if (bidang && proker.bidang_id === bidang.id) {
                return next();
            }
        }

        // Anggota - cek apakah anggota bidang, sekretaris, atau bendahara
        if (roleLevel === 6) {
            // Cek anggota bidang
            if (proker.bidang_id) {
                const isAnggotaBidang = await Bidang.isAnggotaOf(userId, proker.bidang_id);
                if (isAnggotaBidang) {
                    return next();
                }
            }

            // Cek anggota sekretaris
            if (proker.nama_kategori === 'Sekretaris') {
                const isAnggotaSekretaris = await DepartemenAnggota.isAnggotaSekretaris(userId);
                if (isAnggotaSekretaris) {
                    return next();
                }
            }

            // Cek anggota bendahara
            if (proker.nama_kategori === 'Bendahara') {
                const isAnggotaBendahara = await DepartemenAnggota.isAnggotaBendahara(userId);
                if (isAnggotaBendahara) {
                    return next();
                }
            }
        }

        return res.status(403).render('errors/403', {
            title: 'Akses Ditolak',
            message: 'Anda tidak memiliki akses untuk melihat program kerja ini',
            user: req.session,
            layout: 'layouts/dashboard'
        });
    } catch (error) {
        console.error('Error in canReadProker:', error);
        return res.status(500).send('Terjadi kesalahan');
    }
};

// Check if user can update proker
const canUpdateProker = async (req, res, next) => {
    const prokerId = req.params.id;
    const userId = req.session.userId;
    const roleLevel = req.session.roleLevel;

    try {
        const proker = await ProgramKerja.findById(prokerId);

        if (!proker) {
            return res.status(404).render('errors/404', {
                title: 'Tidak Ditemukan',
                message: 'Program kerja tidak ditemukan',
                user: req.session,
                layout: 'layouts/dashboard'
            });
        }

        // Admin dan Ketua Umum bisa update semua
        if (roleLevel === 1 || roleLevel === 2) {
            return next();
        }

        // Sekretaris - semua di kategori sekretaris
        if (roleLevel === 3 && proker.nama_kategori === 'Sekretaris') {
            return next();
        }

        // Bendahara - semua di kategori bendahara
        if (roleLevel === 4 && proker.nama_kategori === 'Bendahara') {
            return next();
        }

        // Ketua Bidang - semua di bidangnya
        if (roleLevel === 5) {
            const bidang = await Bidang.findByKetuaId(userId);
            if (bidang && proker.bidang_id === bidang.id) {
                return next();
            }
        }

        // Anggota - hanya milik sendiri
        if (roleLevel === 6 && proker.pengusul_id === userId) {
            return next();
        }

        return res.status(403).render('errors/403', {
            title: 'Akses Ditolak',
            message: 'Anda tidak memiliki akses untuk mengubah program kerja ini',
            user: req.session,
            layout: 'layouts/dashboard'
        });
    } catch (error) {
        console.error('Error in canUpdateProker:', error);
        return res.status(500).send('Terjadi kesalahan');
    }
};

// Check if user can delete proker
const canDeleteProker = async (req, res, next) => {
    const prokerId = req.params.id;
    const userId = req.session.userId;
    const roleLevel = req.session.roleLevel;

    try {
        const proker = await ProgramKerja.findById(prokerId);

        if (!proker) {
            return res.status(404).render('errors/404', {
                title: 'Tidak Ditemukan',
                message: 'Program kerja tidak ditemukan',
                user: req.session,
                layout: 'layouts/dashboard'
            });
        }

        // Admin dan Ketua Umum bisa delete semua
        if (roleLevel === 1 || roleLevel === 2) {
            return next();
        }

        // Sekretaris - semua di kategori sekretaris
        if (roleLevel === 3 && proker.nama_kategori === 'Sekretaris') {
            return next();
        }

        // Bendahara - semua di kategori bendahara
        if (roleLevel === 4 && proker.nama_kategori === 'Bendahara') {
            return next();
        }

        // Ketua Bidang - semua di bidangnya
        if (roleLevel === 5) {
            const bidang = await Bidang.findByKetuaId(userId);
            if (bidang && proker.bidang_id === bidang.id) {
                return next();
            }
        }

        // Anggota - hanya milik sendiri
        if (roleLevel === 6 && proker.pengusul_id === userId) {
            return next();
        }

        return res.status(403).render('errors/403', {
            title: 'Akses Ditolak',
            message: 'Anda tidak memiliki akses untuk menghapus program kerja ini',
            user: req.session,
            layout: 'layouts/dashboard'
        });
    } catch (error) {
        console.error('Error in canDeleteProker:', error);
        return res.status(500).send('Terjadi kesalahan');
    }
};

// Check if user can approve proker
const canApproveProker = (req, res, next) => {
    const roleLevel = req.session.roleLevel;

    // Hanya Admin dan Ketua Umum yang bisa approve
    if (roleLevel === 1 || roleLevel === 2) {
        return next();
    }

    return res.status(403).render('errors/403', {
        title: 'Akses Ditolak',
        message: 'Hanya Admin dan Ketua Umum yang dapat menyetujui program kerja',
        user: req.session,
        layout: 'layouts/dashboard'
    });
};

module.exports = {
    canCreateProker,
    canReadProker,
    canUpdateProker,
    canDeleteProker,
    canApproveProker
};