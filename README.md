# WAD Capstone API

RESTful API untuk Capstone Project Web Advanced Development. API ini merupakan sistem manajemen tugas (Task Management) yang memiliki fitur autentikasi, otorisasi berbasis peran (RBAC), serta keamanan yang diperkuat (Security Hardening).

## 🚀 Fitur Utama

- **Autentikasi & Otorisasi**: Login, Register, JWT Access & Refresh Tokens, dan Role-Based Access Control (USER & ADMIN).
- **Manajemen Tugas (CRUD)**: Create, Read, Update, Delete untuk entitas Tugas (Tasks).
- **Ownership Check**: Pengguna biasa hanya dapat melihat dan memanipulasi tugas milik mereka sendiri.
- **Relasi Database**: Relasi One-to-Many antara Users dan Tasks, serta Categories dan Tasks.
- **Security Hardening**: Implementasi Helmet (HTTP Headers), CORS, Express Rate Limit (Anti Brute-Force), dan XSS Sanitization.
- **Validasi Data**: Validasi *request body* dan *query parameters* menggunakan Joi.
- **Dokumentasi API**: Terintegrasi secara otomatis menggunakan Swagger UI.

## 🛠️ Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **Database**: MySQL (via XAMPP atau Docker)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Keamanan**: `argon2` (Password Hashing), `jsonwebtoken`, `helmet`, `cors`, `express-rate-limit`, `xss`
- **Validasi**: `joi`
- **Real-Time**: `socket.io`
- **Dokumentasi**: `swagger-jsdoc`, `swagger-ui-express`

---

## 💻 Panduan Instalasi & Menjalankan Server

### 1. Prasyarat
- Node.js v18+
- npm
- MySQL (Bisa menggunakan XAMPP atau layanan database lain)

### 2. Instalasi Dependensi
Clone repositori ini, lalu jalankan:
```bash
npm install
```

### 3. Konfigurasi Environment
Salin file template `.env` dan sesuaikan dengan konfigurasi lokal Anda:
```bash
cp .env.example .env
```
Pastikan `DATABASE_URL` di dalam file `.env` mengarah ke database MySQL Anda. Contoh:
`DATABASE_URL="mysql://root:@localhost:3306/wadcapstone"`

### 4. Setup Database & Seeding
Jalankan migrasi Prisma untuk membuat tabel, lalu lakukan *seeding* data awal:
```bash
# Push schema ke database
npx prisma db push

# (Opsional) Buka Prisma Studio untuk melihat data via GUI
npx prisma studio

# Masukkan data dummy (seeding)
npm run db:seed
```

**Informasi Seed Data:**
Setelah menjalankan `db:seed`, database akan memiliki 3 user default dengan password yang sama: **`P@ssw0rd!`**
1. `budi@example.com` (Role: USER)
2. `siti@example.com` (Role: USER)
3. `admin@example.com` (Role: ADMIN)

### 5. Menjalankan Server

```bash
# Development mode (dengan nodemon untuk auto-restart)
npm run dev

# Production mode
npm start
```

Server akan berjalan di `http://localhost:3000`.

---

## 📚 Dokumentasi API (Swagger)

Setelah server berjalan, Anda dapat melihat dan mencoba seluruh endpoint API melalui antarmuka Swagger UI di:

👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

---

## 🛣️ Struktur Endpoint Utama

API dikelompokkan ke dalam beberapa *prefix* `/api/v1/`:

### 🔐 Auth Routes (`/api/v1/auth`)
| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| POST | `/register` | Registrasi user baru | ❌ |
| POST | `/login` | Login & dapatkan token (Access & Refresh) | ❌ |
| POST | `/refresh` | Dapatkan token akses baru menggunakan Refresh Token | ❌ |
| POST | `/logout` | Logout (Revoke token) | ❌ |
| GET | `/me` | Lihat profil user saat ini | ✅ |

### 📝 Tasks Routes (`/api/v1/tasks`)
Semua rute tasks dilindungi oleh `Ownership Check` jika diakses oleh `USER`.
| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| GET | `/` | Lihat daftar tasks (dengan Pagination, Sort, Filter) | ✅ |
| POST | `/` | Buat task baru | ✅ |
| GET | `/:id` | Detail satu task | ✅ |
| PATCH | `/:id` | Perbarui task (Partial update) | ✅ |
| DELETE| `/:id` | Hapus task | ✅ |

### 🛡️ Admin Routes (`/api/v1/admin`)
Hanya dapat diakses oleh user dengan role `ADMIN`.
| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| GET | `/users` | Lihat semua user | ✅ (ADMIN) |
| GET | `/tasks` | Lihat semua task global (tanpa batas ownership) | ✅ (ADMIN) |
| PATCH | `/users/:id/role`| Ubah role user | ✅ (ADMIN) |

### 👤 Users Routes (`/api/v1/users`)
| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| GET | `/:id/tasks` | Lihat semua task milik user tertentu | ✅ |

---

## 🔒 Security Hardening (Lab 7)

Aplikasi ini telah diperkuat menggunakan beberapa standar keamanan:
- **Helmet**: Menyuntikkan *headers* keamanan (`Content-Security-Policy`, `X-Frame-Options`, dll) untuk mencegah serangan sisi klien.
- **CORS**: Mengunci API agar hanya dapat diakses oleh *origin* yang terdaftar di `.env` (`ALLOWED_ORIGINS`).
- **Rate Limiting**: 
  - *Global*: Maksimal 100 request / 15 menit per IP.
  - *Auth/Sensitif*: Maksimal 5 kegagalan login / 15 menit per IP untuk mencegah *brute-force attack*.
- **XSS Sanitization**: Middleware yang menggunakan library `xss` untuk membersihkan *request body* dari injeksi script berbahaya sebelum disimpan ke database.
- **Argon2**: Standar *hashing* modern untuk mengamankan kata sandi di database.

---

## 📡 Real-Time Updates (Socket.IO)

Aplikasi ini menggunakan Socket.IO untuk menyediakan pembaruan secara *real-time*.

### Koneksi & Autentikasi
Klien harus menyertakan token JWT (Access Token) pada saat melakukan koneksi (handshake):
```javascript
const socket = io("http://localhost:3000", {
  auth: { token: "YOUR_JWT_TOKEN" }
});
```

### Events yang Tersedia
| Event Name | Room Target | Deskripsi | Payload |
|---|---|---|---|
| `users:online` | *Global* | Broadcast jumlah klien yang sedang aktif setiap ada yang connect/disconnect. | `{ count: number }` |
| `task:created` | `tasks:global` | Ter-trigger setiap ada task baru yang dibuat. | `{ task: Object }` |
| `task:updated` | `tasks:global` | Ter-trigger saat task diperbarui. | `{ task: Object }` |
| `task:deleted` | `tasks:global` | Ter-trigger saat task dihapus. | `{ taskId: number }` |
| `notification` | `user:{userId}` | Notifikasi personal saat pengguna berhasil membuat task. | `{ type, title, message }` |

---

## ☁️ Deployment & CI/CD

Proyek ini telah dikonfigurasi untuk ter-deploy secara otomatis ke VPS menggunakan **GitHub Actions**.

### Arsitektur Deployment
- **Cloud Provider**: Biznet Gio NEO Lite (Ubuntu 22.04)
- **Proses Manager**: PM2
- **Port Publik**: Aplikasi di-serve melalui Nginx Reverse Proxy (Port 80) meneruskan trafik ke backend di port `3000`.

### Alur CI/CD
1. Setiap kali kode baru di-push ke branch `main`, workflow `.github/workflows/deploy.yml` akan berjalan.
2. GitHub Actions masuk ke VPS secara otomatis menggunakan SSH Key (Base64 Secret).
3. Mengeksekusi perintah: `git pull`, `npm install --omit=dev`, dan `pm2 restart backend`.
4. API langsung ter-update di server tanpa perlu login manual ke VPS!
