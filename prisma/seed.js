// File: prisma/seed.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Mulai seeding database MySQL...');

  // Hapus data lama — urutan PENTING karena foreign key constraint!
  // Hapus task dulu (bergantung pada users & categories)
  await prisma.task.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // ─── Buat Categories ──────────────────────────────────
  const [catBelajar, catKerja, catProyek] = await Promise.all([
    prisma.category.create({ data: { name: 'Belajar', color: '#6366F1' } }),
    prisma.category.create({ data: { name: 'Pekerjaan', color: '#F59E0B' } }),
    prisma.category.create({ data: { name: 'Proyek', color: '#10B981' } }),
  ]);
  console.log(' ✓ 3 kategori dibuat');

  // ─── Buat Users ───────────────────────────────────────
  // CATATAN: password di-seed sebagai plain text.
  // Di aplikasi nyata, password WAJIB di-hash (Minggu 6: bcrypt/argon2).
  const [budi, siti] = await Promise.all([
    prisma.user.create({ data: { name: 'Budi Santoso', email: 'budi@example.com', password: 'hashed_later' } }),
    prisma.user.create({ data: { name: 'Siti Rahayu', email: 'siti@example.com', password: 'hashed_later' } }),
  ]);
  console.log(' ✓ 2 user dibuat');

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
