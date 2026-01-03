const User = require('../models/User');
const Role = require('../models/Role');

const userController = {
  // Show all users
  index: async (req, res) => {
    try {
      const users = await User.findAll();
      res.render('users/index', {
        title: 'Daftar User',
        subtitle: 'Manajemen data pengguna sistem',
        layout: 'layouts/dashboard',
        activeMenu: 'users',
        users,
        currentUser: req.session,
        query: req.query // Untuk alert messages
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).send('Terjadi kesalahan');
    }
  },

  // Show create user form
  create: async (req, res) => {
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
  },

  // Store new user
  store: async (req, res) => {
    try {
      const { username, email, password, full_name, phone, address, role_id, is_active } = req.body;

      // Validasi
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
          error: 'Username sudah digunakan'
        });
      }

      // Create user
      await User.create({
        username,
        email,
        password,
        full_name,
        phone,
        address,
        role_id,
        is_active: is_active === 'on' ? true : false
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
  },

  // Show user detail
  show: async (req, res) => {
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
        user: user,
        currentUserId: req.session.userId // Ganti nama agar lebih jelas
      });
    } catch (error) {
      console.error('Error:', error);
      res.redirect('/users?error=Terjadi kesalahan');
    }
  },

  // Show edit user form
  edit: async (req, res) => {
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
        user,
        roles,
        error: null
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Terjadi kesalahan');
    }
  },

  // Update user
  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { new_password, confirm_password, is_active, ...userData } = req.body;

      // Handle password update
      if (new_password) {
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
            user,
            roles,
            error: 'Password baru tidak cocok'
          });
        }
        await User.updatePassword(id, new_password);
      }

      // Update user data
      await User.update(id, {
        ...userData,
        is_active: is_active === 'on' ? true : false
      });

      res.redirect('/users?success=User berhasil diupdate');
    } catch (error) {
      console.error('Error updating user:', error);
      res.redirect(`/users/edit/${id}?error=Gagal mengupdate user`);
    }
  },

  // Delete user
  delete: async (req, res) => {
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
  },

  // Show user profile
  profile: async (req, res) => {
    try {
      const user = await User.findById(req.session.userId);
      res.render('users/profile', {
        title: 'Profil Saya',
        subtitle: 'Kelola informasi profil Anda',
        layout: 'layouts/dashboard',
        breadcrumbs: [
          { label: 'Profil', url: '#' }
        ],
        activeMenu: 'profile',
        user
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Terjadi kesalahan');
    }
  },

  // Update profile
  updateProfile: async (req, res) => {
    try {
      const userId = req.session.userId;
      const { full_name, email, phone, address } = req.body;

      // Check if email is already used by another user
      const existingEmail = await User.findByEmail(email);
      if (existingEmail && existingEmail.id !== userId) {
        const user = await User.findById(userId);
        return res.render('users/profile', {
          title: 'Profil Saya',
          subtitle: 'Kelola informasi profil Anda',
          layout: 'layouts/dashboard',
          breadcrumbs: [
            { label: 'Profil', url: '#' }
          ],
          activeMenu: 'profile',
          user,
          error: 'Email sudah digunakan oleh user lain'
        });
      }

      await User.update(userId, {
        full_name,
        email,
        phone,
        address
      });

      res.redirect('/users/profile?success=Profil berhasil diupdate');
    } catch (error) {
      console.error('Error updating profile:', error);
      res.redirect('/users/profile?error=Gagal mengupdate profil');
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const userId = req.session.userId;
      const { current_password, new_password, confirm_password } = req.body;

      // Validate new password match
      if (new_password !== confirm_password) {
        return res.redirect('/users/profile?error=Password baru tidak cocok');
      }

      // Verify current password
      const user = await User.findById(userId);
      const bcrypt = require('bcrypt');
      const isValid = await bcrypt.compare(current_password, user.password);

      if (!isValid) {
        return res.redirect('/users/profile?error=Password lama salah');
      }

      // Update password
      await User.updatePassword(userId, new_password);
      res.redirect('/users/profile?success=Password berhasil diubah');

    } catch (error) {
      console.error('Error changing password:', error);
      res.redirect('/users/profile?error=Gagal mengubah password');
    }
  }
};

module.exports = userController;