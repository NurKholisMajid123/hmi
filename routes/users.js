const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcrypt');
const { isAdmin, noCache } = require('../middleware/auth');
const { validateUserCreate, validateUserUpdate, sanitizeInput } = require('../middleware/validation');

// List all users
router.get('/', isAdmin, noCache, async (req, res) => {
  try {
    const users = await User.findAll();
    res.render('users/index', {
      title: 'Daftar User',
      subtitle: 'Manajemen data pengguna sistem',
      layout: 'layouts/dashboard',
      activeMenu: 'users',
      users,
      currentUser: req.session,
      query: req.query
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Terjadi kesalahan');
  }
});

// Show create user form
router.get('/create', isAdmin, noCache, async (req, res) => {
  try {
    const roles = await Role.findAll();
    res.render('users/create', {
      title: 'Tambah User Baru',
      subtitle: 'Form untuk menambahkan pengguna baru',
      layout: 'layouts/dashboard',
      breadcrumbs: [
        { label: 'User', url: '/users' },
        { label: 'Tambah User', url: '#' }
      ],
      activeMenu: 'users',
      roles,
      error: null
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Terjadi kesalahan');
  }
});

// Store new user
router.post('/create', isAdmin, sanitizeInput, validateUserCreate, async (req, res) => {
  try {
    const { username, email, password, full_name, phone, address, role_id, is_active } = req.body;

    // Validasi field wajib
    if (!username || !email || !password || !full_name || !role_id) {
      const roles = await Role.findAll();
      return res.render('users/create', {
        title: 'Tambah User Baru',
        subtitle: 'Form untuk menambahkan pengguna baru',
        layout: 'layouts/dashboard',
        breadcrumbs: [
          { label: 'User', url: '/users' },
          { label: 'Tambah User', url: '#' }
        ],
        activeMenu: 'users',
        roles,
        error: 'Semua field wajib diisi'
      });
    }

    // Validasi panjang password
    if (password.length < 6) {
      const roles = await Role.findAll();
      return res.render('users/create', {
        title: 'Tambah User Baru',
        subtitle: 'Form untuk menambahkan pengguna baru',
        layout: 'layouts/dashboard',
        breadcrumbs: [
          { label: 'User', url: '/users' },
          { label: 'Tambah User', url: '#' }
        ],
        activeMenu: 'users',
        roles,
        error: 'Password minimal 6 karakter'
      });
    }

    // Check username exists
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      const roles = await Role.findAll();
      return res.render('users/create', {
        title: 'Tambah User Baru',
        subtitle: 'Form untuk menambahkan pengguna baru',
        layout: 'layouts/dashboard',
        breadcrumbs: [
          { label: 'User', url: '/users' },
          { label: 'Tambah User', url: '#' }
        ],
        activeMenu: 'users',
        roles,
        error: 'Username sudah digunakan'
      });
    }

    // Check email exists
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      const roles = await Role.findAll();
      return res.render('users/create', {
        title: 'Tambah User Baru',
        subtitle: 'Form untuk menambahkan pengguna baru',
        layout: 'layouts/dashboard',
        breadcrumbs: [
          { label: 'User', url: '/users' },
          { label: 'Tambah User', url: '#' }
        ],
        activeMenu: 'users',
        roles,
        error: 'Email sudah digunakan'
      });
    }

    // Create user
    await User.create({
      username,
      email,
      password,
      full_name,
      phone: phone || null,
      address: address || null,
      role_id,
      is_active: is_active === 'on'
    });

    res.redirect('/users?success=User berhasil ditambahkan');

  } catch (error) {
    console.error('Error creating user:', error);
    const roles = await Role.findAll();
    res.render('users/create', {
      title: 'Tambah User Baru',
      subtitle: 'Form untuk menambahkan pengguna baru',
      layout: 'layouts/dashboard',
      breadcrumbs: [
        { label: 'User', url: '/users' },
        { label: 'Tambah User', url: '#' }
      ],
      activeMenu: 'users',
      roles,
      error: 'Terjadi kesalahan saat membuat user'
    });
  }
});

// Show edit user form
router.get('/edit/:id', isAdmin, noCache, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    const roles = await Role.findAll();

    if (!user) {
      return res.redirect('/users?error=User tidak ditemukan');
    }

    res.render('users/edit', {
      title: 'Edit User',
      subtitle: `Ubah data user ${user.username}`,
      layout: 'layouts/dashboard',
      breadcrumbs: [
        { label: 'User', url: '/users' },
        { label: 'Edit User', url: '#' }
      ],
      activeMenu: 'users',
      user: req.session,
      editUser: user,
      currentUserId: req.session.userId,
      roles,
      error: null
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Terjadi kesalahan');
  }
});

// Update user
router.post('/edit/:id', isAdmin, sanitizeInput, validateUserUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, full_name, phone, address, role_id, new_password, confirm_password, is_active } = req.body;

    // Validasi field wajib
    if (!username || !email || !full_name || !role_id) {
      const user = await User.findById(id);
      const roles = await Role.findAll();
      return res.render('users/edit', {
        title: 'Edit User',
        subtitle: `Ubah data user ${user.username}`,
        layout: 'layouts/dashboard',
        breadcrumbs: [
          { label: 'User', url: '/users' },
          { label: 'Edit User', url: '#' }
        ],
        activeMenu: 'users',
        user: req.session,
        editUser: user,
        currentUserId: req.session.userId,
        roles,
        error: 'Semua field wajib diisi'
      });
    }

    // Check username sudah digunakan user lain
    const existingUsername = await User.findByUsername(username);
    if (existingUsername && existingUsername.id !== parseInt(id)) {
      const user = await User.findById(id);
      const roles = await Role.findAll();
      return res.render('users/edit', {
        title: 'Edit User',
        subtitle: `Ubah data user ${user.username}`,
        layout: 'layouts/dashboard',
        breadcrumbs: [
          { label: 'User', url: '/users' },
          { label: 'Edit User', url: '#' }
        ],
        activeMenu: 'users',
        user: req.session,
        editUser: user,
        currentUserId: req.session.userId,
        roles,
        error: 'Username sudah digunakan oleh user lain'
      });
    }

    // Check email sudah digunakan user lain
    const existingEmail = await User.findByEmail(email);
    if (existingEmail && existingEmail.id !== parseInt(id)) {
      const user = await User.findById(id);
      const roles = await Role.findAll();
      return res.render('users/edit', {
        title: 'Edit User',
        subtitle: `Ubah data user ${user.username}`,
        layout: 'layouts/dashboard',
        breadcrumbs: [
          { label: 'User', url: '/users' },
          { label: 'Edit User', url: '#' }
        ],
        activeMenu: 'users',
        user: req.session,
        editUser: user,
        currentUserId: req.session.userId,
        roles,
        error: 'Email sudah digunakan oleh user lain'
      });
    }

    // Handle password update
    if (new_password) {
      if (new_password.length < 6) {
        const user = await User.findById(id);
        const roles = await Role.findAll();
        return res.render('users/edit', {
          title: 'Edit User',
          subtitle: `Ubah data user ${user.username}`,
          layout: 'layouts/dashboard',
          breadcrumbs: [
            { label: 'User', url: '/users' },
            { label: 'Edit User', url: '#' }
          ],
          activeMenu: 'users',
          user: req.session,
          editUser: user,
          currentUserId: req.session.userId,
          roles,
          error: 'Password minimal 6 karakter'
        });
      }

      if (new_password !== confirm_password) {
        const user = await User.findById(id);
        const roles = await Role.findAll();
        return res.render('users/edit', {
          title: 'Edit User',
          subtitle: `Ubah data user ${user.username}`,
          layout: 'layouts/dashboard',
          breadcrumbs: [
            { label: 'User', url: '/users' },
            { label: 'Edit User', url: '#' }
          ],
          activeMenu: 'users',
          user: req.session,
          editUser: user,
          currentUserId: req.session.userId,
          roles,
          error: 'Password baru tidak cocok'
        });
      }
      await User.updatePassword(id, new_password);
    }

    // Update user data
    await User.update(id, {
      username,
      email,
      full_name,
      phone: phone || null,
      address: address || null,
      role_id,
      is_active: is_active === 'on'
    });

    res.redirect('/users?success=User berhasil diupdate');
  } catch (error) {
    console.error('Error updating user:', error);
    res.redirect(`/users/${id}/edit?error=Gagal mengupdate user`);
  }
});

// Delete user
router.post('/delete/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting own account
    if (parseInt(id) === req.session.userId) {
      return res.redirect('/users?error=Tidak bisa menghapus akun sendiri');
    }

    await User.delete(id);
    res.redirect('/users?success=User berhasil dihapus');
  } catch (error) {
    console.error('Error deleting user:', error);
    res.redirect('/users?error=Gagal menghapus user');
  }
});

router.get('/delete/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting own account
    if (parseInt(id) === req.session.userId) {
      return res.redirect('/users?error=Tidak bisa menghapus akun sendiri');
    }

    await User.delete(id);
    res.redirect('/users?success=User berhasil dihapus');
  } catch (error) {
    console.error('Error deleting user:', error);
    res.redirect('/users?error=Gagal menghapus user');
  }
});

// View user detail
router.get('/:id', isAdmin, noCache, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.redirect('/users?error=User tidak ditemukan');
    }

    res.render('users/detail', {
      title: 'Detail User',
      subtitle: `Informasi lengkap user ${user.username}`,
      layout: 'layouts/dashboard',
      breadcrumbs: [
        { label: 'User', url: '/users' },
        { label: 'Detail User', url: '#' }
      ],
      activeMenu: 'users',
      user: req.session,
      viewUser: user,
      currentUserId: req.session.userId
    });
  } catch (error) {
    console.error('Error:', error);
    res.redirect('/users?error=Terjadi kesalahan');
  }
});

module.exports = router;