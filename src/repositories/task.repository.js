// File: src/repositories/task.repository.js
const prisma = require('../config/prisma');

// ─── Helper: Normalisasi enum dari UPPERCASE (Prisma) ke lowercase (API) ───
// Prisma/MySQL menyimpan enum sebagai UPPERCASE (TODO, IN_PROGRESS, DONE, LOW, MEDIUM, HIGH)
// Tapi API kita menggunakan lowercase (todo, in_progress, done, low, medium, high)
function normalizeTask(task) {
  if (!task) return task;
  return {
    ...task,
    status: task.status ? task.status.toLowerCase() : task.status,
    priority: task.priority ? task.priority.toLowerCase() : task.priority,
  };
}

const taskRepository = {
  // ─── List tasks dengan filter, sort, pagination ────────
  async findMany({ userId, status, priority, sort = 'createdAt', order = 'desc', limit = 10, offset = 0 } = {}) {
    const where = {};
    if (userId) where.userId = Number(userId);
    // MySQL enum di Prisma: nilai uppercase (TODO, IN_PROGRESS, DONE)
    if (status) where.status = status.toUpperCase().replace('-', '_');
    if (priority) where.priority = priority.toUpperCase();

    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { [sort]: order },
        take: Number(limit),
        skip: Number(offset),
        include: {
          user: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, name: true, color: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return { data: data.map(normalizeTask), total };
  },

  // ─── Cari satu task by ID ───────────────────────────────
  async findById(id) {
    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true, color: true } },
      },
    });
    return normalizeTask(task);
  },

  // ─── Buat task baru ─────────────────────────────────────
  async create(data) {
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        status: data.status ? data.status.toUpperCase().replace('-', '_') : 'TODO',
        priority: data.priority ? data.priority.toUpperCase() : 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        userId: Number(data.userId),
        categoryId: data.categoryId ? Number(data.categoryId) : null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true, color: true } },
      },
    });
    return normalizeTask(task);
  },

  // ─── Update sebagian field (PATCH) ──────────────────────
  async update(id, data) {
    try {
      const task = await prisma.task.update({
        where: { id: Number(id) },
        data: {
          ...data,
          status: data.status ? data.status.toUpperCase().replace('-', '_') : undefined,
          priority: data.priority ? data.priority.toUpperCase() : undefined,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, name: true, color: true } },
        },
      });
      return normalizeTask(task);
    } catch (e) {
      if (e.code === 'P2025') return null; // Record tidak ditemukan
      throw e;
    }
  },

  // ─── Hapus task ──────────────────────────────────────────
  async remove(id) {
    try {
      await prisma.task.delete({ where: { id: Number(id) } });
      return true;
    } catch (e) {
      if (e.code === 'P2025') return false;
      throw e;
    }
  },

  // ─── JOIN: semua task milik user tertentu ────────────────
  async findByUser(userId) {
    const result = await prisma.user.findUnique({
      where: { id: Number(userId) },
      include: {
        tasks: {
          include: { category: { select: { id: true, name: true, color: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (result && result.tasks) {
      result.tasks = result.tasks.map(normalizeTask);
    }
    return result;
  },
};

module.exports = taskRepository;
