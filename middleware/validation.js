// Validasi untuk registrasi/create user
const validateUserCreate = (req, res, next) => {
    const { username, email, password, full_name, role_id } = req.body;
    const errors = [];

    // Validasi username
    if (!username || username.trim().length < 3) {
        errors.push('Username minimal 3 karakter');
    }

    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push('Username hanya boleh mengandung huruf, angka, dan underscore');
    }

    // Validasi email
    if (!email || !isValidEmail(email)) {
        errors.push('Email tidak valid');
    }

    // Validasi password
    if (!password || password.length < 6) {
        errors.push('Password minimal 6 karakter');
    }

    // Validasi full name
    if (!full_name || full_name.trim().length < 3) {
        errors.push('Nama lengkap minimal 3 karakter');
    }

    // Validasi role
    if (!role_id) {
        errors.push('Role harus dipilih');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors
        });
    }

    next();
};

// Validasi untuk update user
const validateUserUpdate = (req, res, next) => {
    const { username, email, full_name, role_id } = req.body;
    const errors = [];

    if (!username || username.trim().length < 3) {
        errors.push('Username minimal 3 karakter');
    }

    if (!email || !isValidEmail(email)) {
        errors.push('Email tidak valid');
    }

    if (!full_name || full_name.trim().length < 3) {
        errors.push('Nama lengkap minimal 3 karakter');
    }

    if (!role_id) {
        errors.push('Role harus dipilih');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            errors
        });
    }

    next();
};

// Validasi login
const validateLogin = (req, res, next) => {
    const { username, password } = req.body;
    const errors = [];

    if (!username || username.trim().length === 0) {
        errors.push('Username harus diisi');
    }

    if (!password || password.length === 0) {
        errors.push('Password harus diisi');
    }

    if (errors.length > 0) {
        return res.render('auth/login', {
            title: 'Login',
            error: errors.join(', ')
        });
    }

    next();
};

// Helper function untuk validasi email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Sanitize input untuk mencegah XSS
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                // Trim whitespace
                req.body[key] = req.body[key].trim();

                // Basic XSS prevention (untuk lebih aman gunakan library seperti xss)
                req.body[key] = req.body[key]
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            }
        });
    }
    next();
};

module.exports = {
    validateUserCreate,
    validateUserUpdate,
    validateLogin,
    sanitizeInput
};