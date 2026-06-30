// File: prisma/seed.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  console.log('Mulai seeding database MySQL...');

  // Hapus data lama — urutan PENTING karena foreign key constraint!
  await prisma.refreshToken.deleteMany();
  await prisma.task.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Reset auto-increment agar ID mulai dari 1
  await prisma.$executeRawUnsafe('ALTER TABLE categories AUTO_INCREMENT = 1');
  await prisma.$executeRawUnsafe('ALTER TABLE users AUTO_INCREMENT = 1');
  await prisma.$executeRawUnsafe('ALTER TABLE tasks AUTO_INCREMENT = 1');

  // ─── Buat Categories ──────────────────────────────────
  const [catBelajar, catKerja, catProyek] = await Promise.all([
    prisma.category.create({ data: { name: 'Belajar', color: '#6366F1' } }),
    prisma.category.create({ data: { name: 'Pekerjaan', color: '#F59E0B' } }),
    prisma.category.create({ data: { name: 'Proyek', color: '#10B981' } }),
  ]);
  console.log(' ✓ 3 kategori dibuat (ID: 1, 2, 3)');

  // ─── Buat Users (password di-hash dengan argon2) ──────
  const defaultPassword = 'P@ssw0rd!'; // Password default untuk semua seed user
  const hashedPassword = await argon2.hash(defaultPassword);

  const [budi, siti, admin] = await Promise.all([
    prisma.user.create({ data: {
      name: 'Budi Santoso', email: 'budi@example.com',
      password: hashedPassword, role: 'USER'
    }}),
    prisma.user.create({ data: {
      name: 'Siti Rahayu', email: 'siti@example.com',
      password: hashedPassword, role: 'USER'
    }}),
    prisma.user.create({ data: {
      name: 'Admin WAD', email: 'admin@example.com',
      password: hashedPassword, role: 'ADMIN'
    }}),
  ]);
  console.log(` ✓ 3 user dibuat (Password: ${defaultPassword})`);

  // ─── Buat Tasks ──────────────────────────────────────
  await Promise.all([
    prisma.task.create({ data: { title: 'Setup Express server', status: 'DONE', priority: 'HIGH', userId: budi.id, categoryId: catProyek.id } }),
    prisma.task.create({ data: { title: 'Belajar REST API', status: 'DONE', priority: 'HIGH', userId: budi.id, categoryId: catBelajar.id } }),
    prisma.task.create({ data: { title: 'Setup MySQL + XAMPP', status: 'IN_PROGRESS', priority: 'HIGH', userId: budi.id, categoryId: catProyek.id, description: 'Menggunakan Prisma ORM' } }),
    prisma.task.create({ data: { title: 'Belajar Prisma ORM', status: 'TODO', priority: 'MEDIUM', userId: budi.id, categoryId: catBelajar.id } }),
    prisma.task.create({ data: { title: 'Review laporan bulanan', status: 'TODO', priority: 'LOW', userId: siti.id, categoryId: catKerja.id } }),
    prisma.task.create({ data: { title: 'Meeting tim desain', status: 'TODO', priority: 'MEDIUM', userId: siti.id, categoryId: catKerja.id } }),
  ]);
  console.log(' ✓ 6 task dibuat');
  console.log('Seeding selesai!');
}

main()
  .catch((e) => { console.error('Error seeding:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
