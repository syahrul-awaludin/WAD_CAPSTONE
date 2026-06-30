// File: src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const userRepo = require('../repositories/user.repository');
const taskRepo = require('../repositories/task.repository');
const prisma = require('../config/prisma');

// Semua route admin: wajib authenticate + role ADMIN
router.use(authenticate, authorize('ADMIN'));

// GET /api/v1/admin/users — Lihat semua user
router.get('/users', async (req, res, next) => {
  try {
    const users = await userRepo.findAll();
    res.json({ data: users, total: users.length });
  } catch (err) { next(err); }
});

// PATCH /api/v1/admin/users/:id/role — Ubah role user
router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        error: { code: 'INVALID_ROLE', message: 'Role harus USER atau ADMIN.' }
      });
    }

    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ data: user });
  } catch (err) { next(err); }
});

// GET /api/v1/admin/tasks — Lihat semua task dari semua user
router.get('/tasks', async (req, res, next) => {
  try {
    const { data, total } = await taskRepo.findMany({});
    res.json({ data, total });
  } catch (err) { next(err); }
});

module.exports = router;
