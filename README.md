# WAD Capstone API - Backend

RESTful API untuk Capstone Project Web Advanced Development. API ini merupakan sistem manajemen tugas (Task Management) yang memiliki fitur autentikasi, otorisasi berbasis peran (RBAC), update real-time via Socket.IO, serta keamanan yang diperkuat (Security Hardening).

🌐 **Live Demo:** [https://syahrulawaludin.my.id](https://syahrulawaludin.my.id)  
📚 **API Docs (Swagger):** [https://syahrulawaludin.my.id/api/docs](https://syahrulawaludin.my.id/api/docs)

---

## 🚀 Fitur Utama

- **Autentikasi & Otorisasi**: Login, Register, JWT Access & Refresh Tokens, dan Role-Based Access Control (USER & ADMIN).
- **Manajemen Tugas (CRUD)**: Create, Read, Update, Delete untuk entitas Tugas (Tasks) dan Kategori.
- **Ownership Check**: Pengguna biasa hanya dapat melihat dan memanipulasi tugas milik mereka sendiri.
- **Relasi Database**: Relasi One-to-Many antara Users dan Tasks, serta Categories dan Tasks.
- **Security Hardening**: Implementasi Helmet (HTTP Headers), CORS, Express Rate Limit (Anti Brute-Force), dan XSS Sanitization.
- **Validasi Data**: Validasi *request body* dan *query parameters* menggunakan Joi.
- **Real-Time Updates**: Socket.IO untuk broadcast event task (create, update, delete) dan notifikasi personal.
- **Dokumentasi API**: Terintegrasi secara otomatis menggunakan Swagger UI.

---

## 🛠️ Tech Stack

| Kategori | Teknologi |
|---|---|
| **Runtime** | [Node.js](https://nodejs.org/) v18+ |
| **Framework** | [Express.js](https://expressjs.com/) |
| **Database** | MySQL |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Real-Time** | `socket.io` |
| **Keamanan** | `argon2`, `jsonwebtoken`, `helmet`, `cors`, `express-rate-limit`, `xss` |
| **Validasi** | `joi` |
| **Dokumentasi** | `swagger-jsdoc`, `swagger-ui-express` |

---

## 💻 Panduan Instalasi & Menjalankan Server

### 1. Prasyarat
- Node.js v18+
- npm
- MySQL (XAMPP, Docker, atau layanan database lain)

### 2. Instalasi Dependensi
Clone repositori ini, lalu jalankan:
```bash
git clone <URL_REPOSITORI_INI>
cd wad-capstone
npm install
```

### 3. Konfigurasi Environment
Salin file template `.env` dan sesuaikan dengan konfigurasi lokal Anda:
```bash
cp .env.example .env
```

Edit file `.env` dengan nilai yang sesuai:
```env
PORT=3000
NODE_ENV=development

# MySQL Connection String
DATABASE_URL="mysql://root:@localhost:3306/wadcapstone"

# JWT Secrets (Generate dengan: openssl rand -hex 32)
JWT_ACCESS_SECRET=ISI_DENGAN_SECRET_ACAK
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=ISI_DENGAN_SECRET_ACAK_BERBEDA
JWT_REFRESH_EXPIRES_IN=7d

# CORS: Origin yang diizinkan (pisahkan dengan koma, tanpa spasi)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001,https://syahrulawaludin.my.id
```

> **Tips:** Generate JWT Secret yang aman dengan perintah: `openssl rand -hex 32`

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
Setelah menjalankan `db:seed`, database akan memiliki 3 user default:

| Email | Role |
|---|---|
| `budi@example.com` | USER |
| `siti@example.com` | USER |
| `admin@example.com` | ADMIN |

> **Catatan:** Password akun seed bersifat rahasia. Hubungi administrator untuk mendapatkan akses.

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

- **Lokal:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Production:** [https://syahrulawaludin.my.id/api/docs](https://syahrulawaludin.my.id/api/docs)

---

## 🛣️ Struktur Endpoint Utama

Semua endpoint berada di bawah prefix `/api/v1/`.

### 🔐 Auth Routes (`/api/v1/auth`)
| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| POST | `/register` | Registrasi user baru | ❌ |
| POST | `/login` | Login & dapatkan token (Access & Refresh) | ❌ |
| POST | `/refresh` | Dapatkan token akses baru menggunakan Refresh Token | ❌ |
| POST | `/logout` | Logout (Revoke Refresh Token) | ❌ |
| GET | `/me` | Lihat profil user saat ini | ✅ |

### 📝 Tasks Routes (`/api/v1/tasks`)
Semua rute tasks dilindungi oleh `Ownership Check` jika diakses oleh `USER`.
| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| GET | `/` | Lihat daftar tasks (Pagination, Sort, Filter) | ✅ |
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

## 🔒 Security Hardening

Aplikasi ini telah diperkuat menggunakan beberapa standar keamanan:

| Mekanisme | Deskripsi |
|---|---|
| **Helmet** | Menyuntikkan HTTP security headers (`Content-Security-Policy`, `X-Frame-Options`, dll) |
| **CORS** | Mengunci API agar hanya dapat diakses oleh *origin* yang terdaftar di `ALLOWED_ORIGINS` |
| **Rate Limiting (Global)** | Maksimal 100 request / 15 menit per IP |
| **Rate Limiting (Auth)** | Maksimal 5 kegagalan login / 15 menit per IP (anti *brute-force*) |
| **XSS Sanitization** | Membersihkan *request body* dari injeksi script berbahaya sebelum disimpan ke database |
| **Argon2** | Standar *hashing* modern untuk mengamankan kata sandi di database |

---

## 📡 Real-Time Updates (Socket.IO)

Aplikasi ini menggunakan Socket.IO untuk menyediakan pembaruan secara *real-time*.

### Koneksi & Autentikasi
Klien harus menyertakan token JWT (Access Token) pada saat melakukan koneksi:
```javascript
// Di production, gunakan origin domain untuk koneksi otomatis
const socket = io(window.location.origin, {
  auth: { token: "YOUR_JWT_ACCESS_TOKEN" }
});
```

### Events yang Tersedia
| Event Name | Room Target | Deskripsi | Payload |
|---|---|---|---|
| `users:online` | *Global* | Broadcast jumlah klien aktif saat connect/disconnect | `{ count: number }` |
| `task:created` | `tasks:global` | Ter-trigger saat task baru dibuat | `{ task: Object }` |
| `task:updated` | `tasks:global` | Ter-trigger saat task diperbarui | `{ task: Object }` |
| `task:deleted` | `tasks:global` | Ter-trigger saat task dihapus | `{ taskId: number }` |
| `notification` | `user:{userId}` | Notifikasi personal saat pengguna membuat task | `{ type, title, message }` |

---

## ☁️ Deployment & CI/CD

Proyek ini telah dikonfigurasi untuk ter-deploy secara otomatis ke VPS menggunakan **GitHub Actions**.

### Arsitektur Deployment

```
Internet (HTTPS Port 443)
           │
           ▼
┌──────────────────────────────────┐
│    Nginx Reverse Proxy           │  ← syahrulawaludin.my.id
│    SSL/TLS via Let's Encrypt     │
│    (Auto-renew oleh Certbot)     │
└──────┬─────────────────┬─────────┘
       │                 │
       ▼                 ▼
  /api/, /socket.io/    /
  Backend (PM2:3000)    Frontend (PM2:3001)
```

### Detail Infrastruktur
| Komponen | Detail |
|---|---|
| **Cloud Provider** | Biznet Gio NEO Lite |
| **OS** | Ubuntu 22.04 LTS |
| **Web Server** | Nginx (Reverse Proxy) |
| **SSL/TLS** | Let's Encrypt (via Certbot) - Auto-renew |
| **Domain** | `https://syahrulawaludin.my.id` |
| **Proses Manager** | PM2 |
| **Port Backend** | `3000` (internal, diproxy oleh Nginx) |

### Konfigurasi Nginx (`/etc/nginx/sites-available/wad`)
```nginx
server {
    listen 80;
    server_name syahrulawaludin.my.id www.syahrulawaludin.my.id;

    # Socket.IO → Backend (harus di atas /api/)
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # REST API → Backend (port 3000)
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Frontend → port 3001
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Alur CI/CD
1. Setiap kali kode baru di-push ke branch `main`, workflow `.github/workflows/deploy.yml` akan berjalan.
2. GitHub Actions masuk ke VPS secara otomatis menggunakan SSH Key (Base64 Secret).
3. Mengeksekusi perintah: `git pull`, `npm install --omit=dev`, dan `pm2 restart backend`.
4. API langsung ter-update di server tanpa perlu login manual ke VPS!

### GitHub Secrets yang Diperlukan
| Secret | Keterangan |
|---|---|
| `SSH_PRIVATE_KEY` | Private key SSH (di-encode Base64) |
| `VPS_HOST` | Alamat IP publik VPS |
| `VPS_USER` | Username SSH VPS |
| `VPS_PORT` | Port SSH (default: `22`) |
