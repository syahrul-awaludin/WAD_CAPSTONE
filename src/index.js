// File: src/index.js (versi terbaru Minggu 2)
// Muat konfigurasi (sekaligus memuat .env via config/index.js)
const config = require('./config');
const express = require('express');
const routes = require('./routes');
const tasksRoutes = require('./routes/tasks.routes');
const setupSwagger = require('./docs/swagger');

// ─── Inisialisasi Express App ────────────────────────────────
const app = express();

// ─── Middleware Global ───────────────────────────────────────
// Parsing JSON body — wajib untuk menerima request dengan body JSON
app.use(express.json());

// Parsing URL-encoded body (form data)
app.use(express.urlencoded({ extended: true }));

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
app.use('/', routes);            // /health
app.use('/api', routes);         // /api/info, /api/echo/:msg
app.use('/api/v1/tasks', tasksRoutes); // /api/v1/tasks (CRUD)

// ─── Swagger UI ─────────────────────────────────────────────
setupSwagger(app);

// ─── 404 Handler ─────────────────────────────────────────────
// Tangkap request ke route yang tidak ada
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
// Middleware error handler memiliki 4 parameter (err, req, res, next)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: config.nodeEnv === 'development' ? err.message : 'Terjadi kesalahan di server.',
    },
  });
});

// ─── Start Server ────────────────────────────────────────────
app.listen(config.port, () => {
  console.log('─'.repeat(50));
  console.log(` ${config.appName} v${config.version}`);
  console.log(` Environment : ${config.nodeEnv}`);
  console.log(` Server      : http://localhost:${config.port}`);
  console.log(` Docs        : http://localhost:${config.port}/api/docs`);
  console.log('─'.repeat(50));
});

module.exports = app; // Ekspor untuk keperluan testing
