const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { isAuthenticated } = require('../middleware/auth');
const User = require('../models/User');
const Bidang = require('../models/Bidang');
const DepartemenAnggota = require('../models/DepartemenAnggota');

// Setup multer untuk upload foto profil
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../public/uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + req.session.userId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (JPEG, PNG, GIF) yang diperbolehkan!'));
    }
  }
});

// GET /profile - View profile
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Get user data dengan informasi lengkap
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).render('errors/404', {
        title: 'User Tidak Ditemukan',
        message: 'Data user tidak ditemukan',
        user: req.session,
        layout: 'layouts/dashboard'
      });
    }

    // Get bidang info jika user adalah ketua bidang
    let bidangKetua = null;
    if (user.bidang_ketua_id) {
      bidangKetua = await Bidang.findById(user.bidang_ketua_id);
    }

    // Get bidang anggota detail
    let bidangAnggotaList = [];
    if (user.role_level === 6) {
      const query = `
        SELECT b.id, b.nama_bidang, b.deskripsi
        FROM user_bidang ub
        JOIN bidang b ON ub.bidang_id = b.id
        WHERE ub.user_id = $1
      `;
      const pool = require('../config/database');
      const result = await pool.query(query, [userId]);
      bidangAnggotaList = result.rows;
    }

    res.render('profile/index', {
      title: 'Profil Saya',
      activeMenu: 'profile',
      user: req.session,
      userData: user,
      bidangKetua,
      bidangAnggotaList,
      layout: 'layouts/dashboard'
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    res.status(500).send('Terjadi kesalahan saat memuat profil');
  }
});

// GET /profile/edit - Edit profile form
router.get('/edit', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).render('errors/404', {
        title: 'User Tidak Ditemukan',
        message: 'Data user tidak ditemukan',
        user: req.session,
        layout: 'layouts/dashboard'
      });
    }

    res.render('profile/edit', {
      title: 'Edit Profil',
      activeMenu: 'profile',
      user: req.session,
      userData: user,
      errors: {},
      layout: 'layouts/dashboard'
    });
  } catch (error) {
    console.error('Error loading edit profile:', error);
    res.status(500).send('Terjadi kesalahan saat memuat form edit profil');
  }
});

// POST /profile/edit - Update profile
router.post('/edit', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { full_name, email, phone, address } = req.body;
    
    // Validation
    const errors = {};
    if (!full_name || full_name.trim() === '') {
      errors.full_name = 'Nama lengkap harus diisi';
    }
    if (!email || email.trim() === '') {
      errors.email = 'Email harus diisi';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Format email tidak valid';
    }

    // Check if email already used by another user
    if (email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        errors.email = 'Email sudah digunakan oleh user lain';
      }
    }

    if (Object.keys(errors).length > 0) {
      const user = await User.findById(userId);
      return res.render('profile/edit', {
        title: 'Edit Profil',
        activeMenu: 'profile',
        user: req.session,
        userData: { ...user, full_name, email, phone, address },
        errors,
        layout: 'layouts/dashboard'
      });
    }

    // Update user data
    const pool = require('../config/database');
    const query = `
      UPDATE users 
      SET full_name = $1, email = $2, phone = $3, address = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;
    const result = await pool.query(query, [full_name, email, phone || null, address || null, userId]);

    // Update session
    req.session.fullName = full_name;
    req.session.email = email;

    req.session.successMessage = 'Profil berhasil diperbarui';
    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).send('Terjadi kesalahan saat memperbarui profil');
  }
});

// POST /profile/upload-photo - Upload profile photo
router.post('/upload-photo', isAuthenticated, upload.single('profile_photo'), async (req, res) => {
  try {
    const userId = req.session.userId;
    
    if (!req.file) {
      req.session.errorMessage = 'Tidak ada file yang diupload';
      return res.redirect('/profile/edit');
    }

    // Get old profile photo
    const user = await User.findById(userId);
    const oldPhoto = user.profile_photo;

    // Update database
    const pool = require('../config/database');
    const photoPath = '/uploads/profiles/' + req.file.filename;
    const query = 'UPDATE users SET profile_photo = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    await pool.query(query, [photoPath, userId]);

    // Delete old photo if exists
    if (oldPhoto) {
      const oldPhotoPath = path.join(__dirname, '../public', oldPhoto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Update session
    req.session.profilePhoto = photoPath;

    req.session.successMessage = 'Foto profil berhasil diperbarui';
    res.redirect('/profile');
  } catch (error) {
    console.error('Error uploading photo:', error);
    req.session.errorMessage = error.message || 'Terjadi kesalahan saat upload foto';
    res.redirect('/profile/edit');
  }
});

// GET /profile/change-password - Change password form
router.get('/change-password', isAuthenticated, async (req, res) => {
  res.render('profile/change-password', {
    title: 'Ubah Password',
    activeMenu: 'profile',
    user: req.session,
    errors: {},
    layout: 'layouts/dashboard'
  });
});

// POST /profile/change-password - Update password
router.post('/change-password', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { current_password, new_password, confirm_password } = req.body;
    
    // Validation
    const errors = {};
    if (!current_password) {
      errors.current_password = 'Password lama harus diisi';
    }
    if (!new_password) {
      errors.new_password = 'Password baru harus diisi';
    } else if (new_password.length < 6) {
      errors.new_password = 'Password baru minimal 6 karakter';
    }
    if (!confirm_password) {
      errors.confirm_password = 'Konfirmasi password harus diisi';
    } else if (new_password !== confirm_password) {
      errors.confirm_password = 'Konfirmasi password tidak cocok';
    }

    if (Object.keys(errors).length > 0) {
      return res.render('profile/change-password', {
        title: 'Ubah Password',
        activeMenu: 'profile',
        user: req.session,
        errors,
        layout: 'layouts/dashboard'
      });
    }

    // Verify current password
    const user = await User.findById(userId);
    const isValidPassword = await User.verifyPassword(current_password, user.password);
    
    if (!isValidPassword) {
      errors.current_password = 'Password lama tidak valid';
      return res.render('profile/change-password', {
        title: 'Ubah Password',
        activeMenu: 'profile',
        user: req.session,
        errors,
        layout: 'layouts/dashboard'
      });
    }

    // Update password
    await User.updatePassword(userId, new_password);

    req.session.successMessage = 'Password berhasil diubah';
    res.redirect('/profile');
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).send('Terjadi kesalahan saat mengubah password');
  }
});

module.exports = router;