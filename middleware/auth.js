// Middleware untuk cek apakah user sudah login
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect('/login');
};

// Middleware untuk cek apakah user belum login (untuk halaman login)
const isGuest = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  next();
};

// Middleware untuk cek role berdasarkan level
const checkRole = (...allowedLevels) => {
  return (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.redirect('/login');
    }

    const userLevel = req.session.roleLevel;
    if (allowedLevels.includes(userLevel)) {
      return next();
    }

    res.status(403).render('errors/403', {
      title: 'Akses Ditolak',
      message: 'Anda tidak memiliki akses ke halaman ini',
      user: req.session
    });
  };
};

// Middleware khusus untuk Admin only
const isAdmin = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }

  if (req.session.roleLevel === 1) {
    return next();
  }

  res.status(403).render('errors/403', {
    title: 'Akses Ditolak',
    message: 'Halaman ini hanya dapat diakses oleh Administrator',
    user: req.session
  });
};

// Middleware untuk pengurus inti
const isPengurus = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }

  const userLevel = req.session.roleLevel;
  if (userLevel >= 1 && userLevel <= 3) {
    return next();
  }

  res.status(403).render('errors/403', {
    title: 'Akses Ditolak',
    message: 'Halaman ini hanya dapat diakses oleh Pengurus Inti',
    user: req.session
  });
};

// Middleware untuk set local variables
const setLocals = (req, res, next) => {
  res.locals.user = req.session || null;
  res.locals.isAuthenticated = req.session && req.session.userId ? true : false;

  res.locals.isAdmin = () => {
    return req.session && req.session.roleLevel === 1;
  };

  res.locals.isPengurus = () => {
    return req.session && req.session.roleLevel >= 1 && req.session.roleLevel <= 3;
  };

  res.locals.isKabid = () => {
    return req.session && req.session.roleLevel === 4;
  };

  res.locals.hasRole = (level) => {
    return req.session && req.session.roleLevel === level;
  };

  res.locals.canAccess = (...levels) => {
    return req.session && levels.includes(req.session.roleLevel);
  };

  next();
};

// Middleware untuk logging activity
const logActivity = (req, res, next) => {
  if (req.session && req.session.userId) {
    // FIXED: Bug template literal
    console.log(`[${new Date().toISOString()}] User: ${req.session.username} | Action: ${req.method} ${req.path}`);
  }
  next();
};

// Middleware untuk mencegah cache
const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.setHeader('Expires', '-1');
  res.setHeader('Pragma', 'no-cache');
  next();
};

// Middleware untuk Ketua Bidang
const isKetuaBidang = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }

  // Admin dan Ketua Umum bisa akses semua
  if (req.session.roleLevel === 1 || req.session.roleLevel === 2) {
    return next();
  }

  // Role level 4 adalah Ketua Bidang
  if (req.session.roleLevel === 4) {
    return next();
  }

  res.status(403).render('errors/403', {
    title: 'Akses Ditolak',
    message: 'Halaman ini hanya dapat diakses oleh Ketua Bidang atau Admin',
    user: req.session
  });
};

module.exports = {
  isAuthenticated,
  isGuest,
  checkRole,
  isAdmin,
  isPengurus,
  isKetuaBidang,
  setLocals,
  logActivity,
  noCache
};