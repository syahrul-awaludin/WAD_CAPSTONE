// File: src/repositories/user.repository.js
const prisma = require('../config/prisma');

const userRepository = {
  async findAll() {
    return prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id) {
    return prisma.user.findUnique({
      where: { id: Number(id) },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  },

  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },
};

module.exports = userRepository;
