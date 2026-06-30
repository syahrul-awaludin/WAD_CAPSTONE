// File: src/index.js (versi Week 3 - MySQL via Prisma)
// Muat konfigurasi (sekaligus memuat .env via config/index.js)
const config = require('./config');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const corsOptions = require('./config/cors');
const { apiLimiter, authLimiter, sensitiveLimiter } = require('./config/rateLimiter');

const routes = require('./routes');
const tasksRoutes = require('./routes/tasks.routes');
const usersRoutes = require('./routes/users.routes');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const authenticate = require('./middleware/authenticate');
const setupSwagger = require('./docs/swagger');

// ─── Inisialisasi Express App ────────────────────────────────
const app = express();

// ─── 1. Security Headers (Helmet) ──────────────────────
// Harus dipasang PALING AWAL sebelum middleware lain
app.use(helmet());

// ─── 2. CORS ─────────────────────────────────────────
app.use(cors(corsOptions));
// Handle preflight untuk semua route otomatis dikelola oleh app.use(cors()) jika tidak ada error path

// ─── Middleware Global ───────────────────────────────────────
// Parsing JSON body — wajib untuk menerima request dengan body JSON (limit 10kb)
app.use(express.json({ limit: '10kb' }));

// Parsing URL-encoded body (form data)
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── 4. Rate Limiting Global ─────────────────────────
app.use('/api/', apiLimiter);

// Middleware logging sederhana
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} → ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ─── Routes ─────────────────────────────────────────────────
app.use('/', routes);                  // /health
app.use('/api', routes);              // /api/info, /api/echo/:msg

// Auth routes — rate limiting ketat
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/refresh', sensitiveLimiter);
app.use('/api/v1/auth/register', sensitiveLimiter);
app.use('/api/v1/auth', authRoutes);

// ─── API Routes yang dilindungi ─────────────────────────
app.use('/api/v1', authenticate);
app.use('/api/v1/tasks', tasksRoutes); // /api/v1/tasks (CRUD)
app.use('/api/v1/users', usersRoutes); // /api/v1/users/:userId/tasks (JOIN)
app.use('/api/v1/admin', adminRoutes); // Admin only routes

// ─── Swagger UI ─────────────────────────────────────────────
setupSwagger(app);

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} tidak ditemukan.`,
      hint: 'Kunjungi GET /api/docs untuk dokumentasi API.',
    },
  });
});

// ─── Error Handler Global ────────────────────────────────────
app.use((err, req, res, next) => {
  // CORS error
  if (err.message && err.message.includes('tidak diizinkan oleh CORS')) {
    return res.status(403).json({
      error: { code: 'CORS_ERROR', message: err.message }
    });
  }

  // Error dengan statusCode dari authService
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: { code: err.code || 'AUTH_ERROR', message: err.message },
    });
  }

  // Prisma P2002 duplicate
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: { code: 'DUPLICATE_RESOURCE', message: 'Data sudah digunakan.' }
    });
  }

  console.error('Unhandled error:', err.message);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: config.env === 'development' ? err.message : 'Terjadi kesalahan internal server.',
    },
  });
});

// ─── Start Server ────────────────────────────────────────────
app.listen(config.port, () => {
  console.log('─'.repeat(50));
  console.log(` ${config.appName} v${config.version}`);
  console.log(` Environment : ${config.nodeEnv}`);
  console.log(` Database    : MySQL via XAMPP`);
  console.log(` Server      : http://localhost:${config.port}`);
  console.log(` Docs        : http://localhost:${config.port}/api/docs`);
  console.log('─'.repeat(50));
});

module.exports = app; // Ekspor untuk keperluan testing
