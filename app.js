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
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Middleware untuk parsing body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Middleware untuk static files
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  store: new pgSession({
    pool: pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production', // true jika HTTPS
    httpOnly: true
  }
}));

// Import middleware
const { setLocals, logActivity } = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Apply global middleware
app.use(setLocals); // Set locals untuk semua views
app.use(logActivity); // Log activity (opsional)

// Import routes


const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');
const bidangRoutes = require('./routes/bidang');
const myBidangRoutes = require('./routes/my-bidang');
const prokerRoutes = require('./routes/proker'); 

// Use routes
app.get('/', setLocals, (req, res) => {
  res.render('index', {
    title: 'Landing Page',
    layout: false
  });
});
app.use('/', authRoutes); // Login/logout
app.use('/dashboard', dashboardRoutes);
app.use('/users', userRoutes);
app.use('/bidang', bidangRoutes);
app.use('/my-bidang', myBidangRoutes);
app.use('/proker', prokerRoutes);


// Error handlers
app.use(notFound); // 404 handler
app.use(errorHandler); // General error handler

// Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});