// File: src/config/rateLimiter.js
const rateLimit = require('express-rate-limit');

// Limiter umum: semua endpoint API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // 100 request per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Terlalu banyak request dari IP ini. Coba lagi dalam 15 menit.',
    },
  },
});

// Limiter ketat: endpoint autentikasi (anti brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Hanya 5 percobaan per 15 menit
  skipSuccessfulRequests: true, // Login berhasil tidak dihitung
  message: {
    error: {
      code: 'TOO_MANY_ATTEMPTS',
      message: 'Terlalu banyak percobaan login. Tunggu 15 menit.',
    },
  },
});

// Limiter untuk endpoint sensitif lainnya (refresh token, register)
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 20,
  message: {
    error: { code: 'TOO_MANY_REQUESTS', message: 'Batas request tercapai.' }
  },
});

module.exports = { apiLimiter, authLimiter, sensitiveLimiter };
