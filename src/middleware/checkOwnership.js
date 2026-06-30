// File: src/middleware/checkOwnership.js
const taskRepo = require('../repositories/task.repository');

/**
 * Middleware untuk memastikan user hanya bisa mengakses task miliknya sendiri.
 * Admin diizinkan mengakses task siapapun.
 * Digunakan SETELAH middleware authenticate.
 */
const checkTaskOwnership = async (req, res, next) => {
  try {
    // Admin bypass ownership check — boleh akses semua task
    if (req.user.role === 'ADMIN') return next();

    const task = await taskRepo.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Task tidak ditemukan.' },
      });
    }

    // Cek kepemilikan: userId task harus sama dengan userId dari token
    if (task.userId !== req.user.userId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Kamu tidak memiliki izin untuk mengakses task ini.',
        },
      });
    }

    // Simpan task di req agar controller tidak perlu query ulang
    req.task = task;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { checkTaskOwnership };
