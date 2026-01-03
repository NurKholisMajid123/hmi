const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Role = require('../models/Role');
const { isAdmin, noCache } = require('../middleware/auth');
const { sanitizeInput, validateEmail } = require('../middleware/validation');

// Helper function untuk render form
const renderForm = (res, type, data = {}) => {
  const isEdit = type === 'edit';
  const baseData = {
    layout: 'layouts/dashboard',
    activeMenu: 'users',
    breadcrumbs: [
      { label: 'User', url: '/users' },
      { label: isEdit ? 'Edit User' : 'Tambah User', url: '#' }
    ],
    error: null,
    ...data
  };
  
  if (isEdit) {
    return res.render('users/edit', {
      title: 'Edit User',
      subtitle: `Ubah data user ${data.editUser?.username}`,
      ...baseData
    });
  }
  
  return res.render('users/create', {
    title: 'Tambah User Baru',
    subtitle: 'Form untuk menambahkan pengguna baru',
    ...baseData
  });
};

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
      query: req.query
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Terjadi kesalahan');
  }
});

// Show create form
router.get('/create', isAdmin, noCache, async (req, res) => {
  try {
    const roles = await Role.findAll();
    renderForm(res, 'create', { roles });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Terjadi kesalahan');
  }
});

// Store new user
router.post('/create', isAdmin, sanitizeInput, async (req, res) => {
  const { username, email, password, full_name, phone, address, role_id, is_active } = req.body;
  
  try {
    const roles = await Role.findAll();
    
    // Validasi field wajib
    if (!username || !email || !password || !full_name || !role_id) {
      return renderForm(res, 'create', { roles, error: 'Semua field wajib diisi' });
    }
    
    // Validasi email format
    if (!validateEmail(email)) {
      return renderForm(res, 'create', { roles, error: 'Format email tidak valid' });
    }
    
    // Validasi password
    if (password.length < 6) {
      return renderForm(res, 'create', { roles, error: 'Password minimal 6 karakter' });
    }
    
    // Check username exists
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return renderForm(res, 'create', { roles, error: 'Username sudah digunakan' });
    }
    
    // Check email exists
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return renderForm(res, 'create', { roles, error: 'Email sudah digunakan' });
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
    renderForm(res, 'create', { roles, error: 'Terjadi kesalahan saat membuat user' });
  }
});

// Show edit form
router.get('/edit/:id', isAdmin, noCache, async (req, res) => {
  try {
    const { id } = req.params;
    const editUser = await User.findById(id);
    const roles = await Role.findAll();
    
    if (!editUser) {
      return res.redirect('/users?error=User tidak ditemukan');
    }
    
    renderForm(res, 'edit', { editUser, roles });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Terjadi kesalahan');
  }
});

// Update user
router.post('/edit/:id', isAdmin, sanitizeInput, async (req, res) => {
  const { id } = req.params;
  const { username, email, full_name, phone, address, role_id, new_password, confirm_password, is_active } = req.body;
  
  try {
    const editUser = await User.findById(id);
    const roles = await Role.findAll();
    
    // Validasi field wajib
    if (!username || !email || !full_name || !role_id) {
      return renderForm(res, 'edit', { editUser, roles, error: 'Semua field wajib diisi' });
    }
    
    // Validasi email format
    if (!validateEmail(email)) {
      return renderForm(res, 'edit', { editUser, roles, error: 'Format email tidak valid' });
    }
    
    // Check username sudah digunakan user lain
    const existingUsername = await User.findByUsername(username);
    if (existingUsername && existingUsername.id !== parseInt(id)) {
      return renderForm(res, 'edit', { editUser, roles, error: 'Username sudah digunakan oleh user lain' });
    }
    
    // Check email sudah digunakan user lain
    const existingEmail = await User.findByEmail(email);
    if (existingEmail && existingEmail.id !== parseInt(id)) {
      return renderForm(res, 'edit', { editUser, roles, error: 'Email sudah digunakan oleh user lain' });
    }
    
    // Handle password update
    if (new_password) {
      if (new_password.length < 6) {
        return renderForm(res, 'edit', { editUser, roles, error: 'Password minimal 6 karakter' });
      }
      if (new_password !== confirm_password) {
        return renderForm(res, 'edit', { editUser, roles, error: 'Password baru tidak cocok' });
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
    res.redirect(`/users/edit/${id}?error=Gagal mengupdate user`);
  }
});

// Delete user (POST only)
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

// View user detail
router.get('/:id', isAdmin, noCache, async (req, res) => {
  try {
    const { id } = req.params;
    const viewUser = await User.findById(id);
    
    if (!viewUser) {
      return res.redirect('/users?error=User tidak ditemukan');
    }
    
    res.render('users/detail', {
      title: 'Detail User',
      subtitle: `Informasi lengkap user ${viewUser.username}`,
      layout: 'layouts/dashboard',
      breadcrumbs: [
        { label: 'User', url: '/users' },
        { label: 'Detail User', url: '#' }
      ],
      activeMenu: 'users',
      viewUser
    });
  } catch (error) {
    console.error('Error:', error);
    res.redirect('/users?error=Terjadi kesalahan');
  }
});

module.exports = router;