// Handle 404 - Not Found
const notFound = (req, res, next) => {
    res.status(404).render('errors/404', {
        title: 'Halaman Tidak Ditemukan',
        url: req.originalUrl,
        user: req.session.userId ? {
            id: req.session.userId,
            username: req.session.username,
            role: req.session.roleName
        } : null
    });
};

// Handle errors
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Terjadi kesalahan pada server';

    // Untuk development, tampilkan stack trace
    if (process.env.NODE_ENV === 'development') {
        res.status(statusCode).render('errors/error', {
            title: 'Error',
            message,
            error: err,
            stack: err.stack,
            user: req.session.userId ? {
                id: req.session.userId,
                username: req.session.username,
                role: req.session.roleName
            } : null
        });
    } else {
        // Untuk production, jangan tampilkan detail error
        res.status(statusCode).render('errors/error', {
            title: 'Error',
            message: statusCode === 500 ? 'Terjadi kesalahan pada server' : message,
            error: {},
            stack: '',
            user: req.session.userId ? {
                id: req.session.userId,
                username: req.session.username,
                role: req.session.roleName
            } : null
        });
    }
};

module.exports = {
    notFound,
    errorHandler
};