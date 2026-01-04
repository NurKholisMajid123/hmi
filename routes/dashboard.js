const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ProgramKerja = require('../models/ProgramKerja');
const Bidang = require('../models/Bidang');
const DepartemenAnggota = require('../models/DepartemenAnggota');
const { isAuthenticated, noCache } = require('../middleware/auth');

// Dashboard
router.get('/', isAuthenticated, noCache, async (req, res) => {
  try {
    const userId = req.session.userId;
    const roleLevel = req.session.roleLevel;

    // Get current user
    const currentUser = await User.findById(userId);
    
    let dashboardData = {
      title: 'Dashboard',
      layout: 'layouts/dashboard',
      activeMenu: 'dashboard',
      hideBreadcrumb: true,
      currentUser,
      roleLevel
    };

    // ADMIN & KETUA UMUM - Full Statistics
    if (roleLevel === 1 || roleLevel === 2) {
      const allUsers = await User.findAll();
      const activeUsers = allUsers.filter(u => u.is_active);
      const allBidang = await Bidang.findAll();
      const allProker = await ProgramKerja.findAll();
      
      const anggotaSekretaris = await DepartemenAnggota.countAnggotaSekretaris();
      const anggotaBendahara = await DepartemenAnggota.countAnggotaBendahara();

      dashboardData.stats = {
        totalUsers: allUsers.length,
        activeUsers: activeUsers.length,
        inactiveUsers: allUsers.length - activeUsers.length,
        admins: allUsers.filter(u => u.role_level === 1).length,
        ketuaUmum: allUsers.filter(u => u.role_level === 2).length,
        sekretaris: allUsers.filter(u => u.role_level === 3).length,
        bendahara: allUsers.filter(u => u.role_level === 4).length,
        ketuaBidang: allUsers.filter(u => u.role_level === 5).length,
        anggota: allUsers.filter(u => u.role_level === 6).length,
        totalBidang: allBidang.length,
        totalAnggotaBidang: allBidang.reduce((sum, b) => sum + (parseInt(b.jumlah_anggota) || 0), 0),
        anggotaSekretaris,
        anggotaBendahara,
        totalProker: allProker.length,
        prokerDraft: allProker.filter(p => p.status === 'draft').length,
        prokerDiajukan: allProker.filter(p => p.status === 'diajukan').length,
        prokerDisetujui: allProker.filter(p => p.status === 'disetujui').length,
        prokerDitolak: allProker.filter(p => p.status === 'ditolak').length,
        prokerBerjalan: allProker.filter(p => p.status === 'berjalan').length,
        prokerSelesai: allProker.filter(p => p.status === 'selesai').length
      };

      dashboardData.recentProker = allProker
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);

      dashboardData.allBidang = allBidang;
      dashboardData.pendingApproval = allProker.filter(p => p.status === 'diajukan').slice(0, 5);
    }

    // SEKRETARIS - Sekretaris Stats
    else if (roleLevel === 3) {
      const anggotaSekretaris = await DepartemenAnggota.getAnggotaSekretaris();
      const sekretarisProker = await ProgramKerja.findByRole(userId, roleLevel);
      
      dashboardData.stats = {
        totalAnggota: anggotaSekretaris.length,
        anggotaAktif: anggotaSekretaris.filter(a => a.is_active).length,
        totalProker: sekretarisProker.length,
        prokerDraft: sekretarisProker.filter(p => p.status === 'draft').length,
        prokerDiajukan: sekretarisProker.filter(p => p.status === 'diajukan').length,
        prokerDisetujui: sekretarisProker.filter(p => p.status === 'disetujui').length
      };

      dashboardData.anggotaList = anggotaSekretaris.slice(0, 5);
      dashboardData.recentProker = sekretarisProker
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
    }

    // BENDAHARA - Bendahara Stats
    else if (roleLevel === 4) {
      const anggotaBendahara = await DepartemenAnggota.getAnggotaBendahara();
      const bendaharaProker = await ProgramKerja.findByRole(userId, roleLevel);
      
      // Calculate total budget
      const totalAnggaran = bendaharaProker.reduce((sum, p) => sum + (parseFloat(p.anggaran) || 0), 0);
      const anggaranDisetujui = bendaharaProker
        .filter(p => p.status === 'disetujui')
        .reduce((sum, p) => sum + (parseFloat(p.anggaran) || 0), 0);

      dashboardData.stats = {
        totalAnggota: anggotaBendahara.length,
        anggotaAktif: anggotaBendahara.filter(a => a.is_active).length,
        totalProker: bendaharaProker.length,
        prokerDraft: bendaharaProker.filter(p => p.status === 'draft').length,
        prokerDiajukan: bendaharaProker.filter(p => p.status === 'diajukan').length,
        prokerDisetujui: bendaharaProker.filter(p => p.status === 'disetujui').length,
        totalAnggaran: totalAnggaran,
        anggaranDisetujui: anggaranDisetujui
      };

      dashboardData.anggotaList = anggotaBendahara.slice(0, 5);
      dashboardData.recentProker = bendaharaProker
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
    }

    // KETUA BIDANG - Bidang Stats
    else if (roleLevel === 5) {
      const userBidang = await Bidang.findByKetuaId(userId);
      
      if (userBidang) {
        const bidangAnggota = await Bidang.getAnggota(userBidang.id);
        const bidangProker = await ProgramKerja.findByRole(userId, roleLevel, userBidang.id);

        dashboardData.userBidang = userBidang;
        dashboardData.stats = {
          totalAnggota: bidangAnggota.length,
          anggotaAktif: bidangAnggota.filter(a => a.is_active).length,
          totalProker: bidangProker.length,
          prokerDraft: bidangProker.filter(p => p.status === 'draft').length,
          prokerDiajukan: bidangProker.filter(p => p.status === 'diajukan').length,
          prokerDisetujui: bidangProker.filter(p => p.status === 'disetujui').length,
          prokerDitolak: bidangProker.filter(p => p.status === 'ditolak').length
        };

        dashboardData.anggotaList = bidangAnggota.slice(0, 5);
        dashboardData.recentProker = bidangProker
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
      } else {
        dashboardData.stats = { noBidang: true };
      }
    }

    // ANGGOTA - Personal Stats
    else if (roleLevel === 6) {
      // Check departemen
      const isDepartemenSekretaris = await DepartemenAnggota.isAnggotaSekretaris(userId);
      const isDepartemenBendahara = await DepartemenAnggota.isAnggotaBendahara(userId);
      
      let userBidang = null;
      let bidangProker = [];
      
      // Get bidang if member
      const bidangList = await Bidang.getUserBidang(userId);
      if (bidangList.length > 0) {
        userBidang = bidangList[0];
        bidangProker = await ProgramKerja.findByRole(userId, roleLevel, userBidang.id);
      }

      // Get all accessible proker
      const allAccessibleProker = await ProgramKerja.findByRole(userId, roleLevel, userBidang?.id);
      
      // Get user's own proker
      const myProker = allAccessibleProker.filter(p => p.pengusul_id === userId);

      dashboardData.userBidang = userBidang;
      dashboardData.isDepartemenSekretaris = isDepartemenSekretaris;
      dashboardData.isDepartemenBendahara = isDepartemenBendahara;
      
      dashboardData.stats = {
        totalProkerSaya: myProker.length,
        prokerDraft: myProker.filter(p => p.status === 'draft').length,
        prokerDiajukan: myProker.filter(p => p.status === 'diajukan').length,
        prokerDisetujui: myProker.filter(p => p.status === 'disetujui').length,
        prokerDitolak: myProker.filter(p => p.status === 'ditolak').length,
        totalProkerAksesible: allAccessibleProker.length
      };

      dashboardData.myProker = myProker
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      
      dashboardData.recentProker = allAccessibleProker
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
    }

    res.render('dashboard/index', dashboardData);
    
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Terjadi kesalahan');
  }
});

module.exports = router;