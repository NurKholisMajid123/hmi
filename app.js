require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const expressLayouts = require('express-ejs-layouts');
const pool = require('./config/database');
const app = express();
const path = require('path');

// Set EJS sebagai view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Setup EJS Layouts
app.use(expressLayouts);
app.set('layout', false); // DISABLE default layout - harus set manual per route
app.set('layout extractScripts', true); // Extract scripts to layout
app.set('layout extractStyles', true); // Extract styles to layout

// Middleware untuk parsing body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware untuk static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'session'
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === 'production'
    }
}));

// Middleware untuk membuat user tersedia di semua views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Import routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');

// Gunakan routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).render('404', { 
        title: '404 - Page Not Found',
        layout: false // Tidak menggunakan layout
    });
});

// Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});