// File: src/config/prisma.js
const { PrismaClient } = require('@prisma/client');

// Singleton: satu instance untuk seluruh aplikasi
// Mencegah terlalu banyak koneksi ke MySQL
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'],
});

// Disconnect saat aplikasi ditutup
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
