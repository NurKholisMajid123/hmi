const xss = require('xss');

// Sanitize input untuk mencegah XSS
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
        req.body[key] = xss(req.body[key]);
      }
    });
  }
  next();
};

// Helper validation functions
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhone = (phone) => {
  const re = /^(\+62|62|0)[0-9]{9,12}$/;
  return re.test(phone);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

module.exports = {
  sanitizeInput,
  validateEmail,
  validatePhone,
  validatePassword
};