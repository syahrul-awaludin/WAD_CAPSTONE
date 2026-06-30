// File: src/controllers/tasks.controller.js (versi MySQL - Week 3)
const taskRepo = require('../repositories/task.repository');

// ─── GET /api/v1/tasks ──────────────────────────────────────
const listTasks = async (req, res, next) => {
  try {
    const { status, priority, sort, order, limit, offset } = req.query;
    
    // User biasa hanya lihat task miliknya; Admin lihat semua
    const userId = req.user.role === 'ADMIN' ? undefined : req.user.userId;
    
    const { data, total } = await taskRepo.findMany({ 
      userId, status, priority, sort, order, limit, offset 
    });

    const numLimit = Number(limit) || 10;
    const numOffset = Number(offset) || 0;

    res.status(200).json({
      data,
      pagination: {
        total,
        limit: numLimit,
        offset: numOffset,
        hasNext: numOffset + numLimit < total,
        hasPrev: numOffset > 0,
        nextOffset: numOffset + numLimit < total ? numOffset + numLimit : null,
        prevOffset: numOffset > 0 ? Math.max(0, numOffset - numLimit) : null,
      },
    });
  } catch (err) { next(err); }
};

// ─── POST /api/v1/tasks ─────────────────────────────────────
const createTask = async (req, res, next) => {
  try {
    // Gunakan userId dari token JWT (diset oleh middleware authenticate)
    const userId = req.user ? req.user.userId : (req.body.userId || 1);
    const task = await taskRepo.create({ ...req.body, userId });
    
    // ── EMIT REAL-TIME EVENT ────────────────────────────
    const io = req.app.get("io");
    if (io) {
      // Kirim ke semua user yang terhubung (room global)
      io.to("tasks:global").emit("task:created", { task });
      // Kirim notifikasi personal ke pembuat task
      io.to(`user:${userId}`).emit("notification", {
        type: "SUCCESS",
        title: "Task Berhasil Dibuat",
        message: `Task "${task.title}" telah ditambahkan.`,
      });
    }

    res.status(201).set('Location', `/api/v1/tasks/${task.id}`).json({ data: task });
  } catch (err) { next(err); }
};

// ─── GET /api/v1/tasks/:id ──────────────────────────────────
const getTask = async (req, res, next) => {
  try {
    const task = await taskRepo.findById(req.params.id);
    if (!task) return res.status(404).json({ error: { code: 'NOT_FOUND', message: `Task ID ${req.params.id} tidak ditemukan.` } });
    res.status(200).json({ data: task });
  } catch (err) { next(err); }
};

// ─── PATCH /api/v1/tasks/:id (Partial Update) ───────────────
const updateTask = async (req, res, next) => {
  try {
    const task = await taskRepo.update(req.params.id, req.body);
    if (!task) return res.status(404).json({ error: { code: 'NOT_FOUND', message: `Task ID ${req.params.id} tidak ditemukan.` } });
    
    const io = req.app.get("io");
    if (io) {
      io.to("tasks:global").emit("task:updated", { task });
    }

    res.status(200).json({ data: task });
  } catch (err) { next(err); }
};

// ─── DELETE /api/v1/tasks/:id ───────────────────────────────
const deleteTask = async (req, res, next) => {
  try {
    const ok = await taskRepo.remove(req.params.id);
    if (!ok) return res.status(404).json({ error: { code: 'NOT_FOUND', message: `Task ID ${req.params.id} tidak ditemukan.` } });
    
    const io = req.app.get("io");
    if (io) {
      io.to("tasks:global").emit("task:deleted", { taskId: parseInt(req.params.id) });
    }

    res.status(204).send();
  } catch (err) { next(err); }
};

// ─── GET /api/v1/users/:userId/tasks (JOIN) ─────────────────
const getTasksByUser = async (req, res, next) => {
  try {
    const result = await taskRepo.findByUser(req.params.userId);
    if (!result) return res.status(404).json({ error: { code: 'NOT_FOUND', message: `User ID ${req.params.userId} tidak ditemukan.` } });
    res.status(200).json({
      data: {
        user: { id: result.id, name: result.name, email: result.email },
        tasks: result.tasks,
        total: result.tasks.length,
      },
    });
  } catch (err) { next(err); }
};

module.exports = { listTasks, createTask, getTask, updateTask, deleteTask, getTasksByUser };
