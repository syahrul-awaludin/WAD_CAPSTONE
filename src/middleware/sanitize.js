// File: src/middleware/sanitize.js
const xss = require('xss');

/**
 * Middleware sanitasi: bersihkan field string dari karakter XSS berbahaya.
 * Dipasang setelah validate middleware.
 */
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitizeValue = (val) => {
      if (typeof val === 'string') return xss(val);
      if (typeof val === 'object' && val !== null) {
        return Object.fromEntries(
          Object.entries(val).map(([k, v]) => [k, sanitizeValue(v)])
        );
      }
      return val;
    };
    req.body = sanitizeValue(req.body);
  }
  next();
};

module.exports = { sanitizeBody };
