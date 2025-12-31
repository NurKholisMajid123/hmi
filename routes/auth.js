const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/database');

// Middleware untuk cek apakah user sudah login
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return res.redirect('/dashboard/index');
    }
    next();
};

// Middleware untuk proteksi halaman yang memerlukan login
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
};

// GET - Halaman Register
router.get('/register', isAuthenticated, (req, res) => {
    res.render('auth/register', { 
        title: 'Register',
        error: null 
    });
});

// POST - Proses Register
router.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    
    try {
        // Validasi input
        if (!username || !email || !password || !confirmPassword) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Semua field harus diisi'
            });
        }

        if (password !== confirmPassword) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Password tidak cocok'
            });
        }

        if (password.length < 6) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Password minimal 6 karakter'
            });
        }

        // Cek apakah username atau email sudah ada
        const userCheck = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (userCheck.rows.length > 0) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'Username atau email sudah terdaftar'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Simpan user ke database
        await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
            [username, email, hashedPassword]
        );

        res.redirect('/auth/login?registered=true');
    } catch (error) {
        console.error('Error during registration:', error);
        res.render('auth/register', {
            title: 'Register',
            error: 'Terjadi kesalahan saat registrasi'
        });
    }
});

// GET - Halaman Login
router.get('/login', isAuthenticated, (req, res) => {
    const registered = req.query.registered === 'true';
    res.render('auth/login', { 
        title: 'Login',
        error: null,
        success: registered ? 'Registrasi berhasil! Silakan login.' : null
    });
});

// POST - Proses Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // Validasi input
        if (!username || !password) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Username dan password harus diisi',
                success: null
            });
        }

        // Cari user di database
        const result = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $1',
            [username]
        );

        if (result.rows.length === 0) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Username atau password salah',
                success: null
            });
        }

        const user = result.rows[0];

        // Verifikasi password
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Username atau password salah',
                success: null
            });
        }

        // Simpan user ke session
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email
        };

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error during login:', error);
        res.render('auth/login', {
            title: 'Login',
            error: 'Terjadi kesalahan saat login',
            success: null
        });
    }
});

// GET - Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/auth/login');
    });
});

// Export middleware
router.requireAuth = requireAuth;

module.exports = router;