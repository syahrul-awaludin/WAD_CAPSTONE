const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const userRepo = require('../repositories/user.repository');
const refreshTokenRepo = require('../repositories/refreshToken.repository');
const prisma = require('../config/prisma');

// ─── Konfigurasi argon2id ────────────────────────────────
// Sesuai rekomendasi OWASP (minimum argon2id)
const ARGON2_OPTIONS = {
  memoryCost: 65536, // 64 MB — semakin tinggi semakin kuat
  timeCost: 3, // Jumlah iterasi
  parallelism: 4, // Thread paralel
};

// ─── Helper: Buat Access Token ───────────────────────────
function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
    jwtid: uuidv4(), // Unique token ID
  });
}

// ─── Helper: Buat Refresh Token ──────────────────────────
function signRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    jwtid: uuidv4(),
  });
}

// ─── Helper: Hitung tanggal expired refresh token ────────
function getRefreshTokenExpiry() {
  const days = parseInt(config.jwt.refreshExpiresIn, 10) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

const authService = {
  // ─── REGISTER ──────────────────────────────────────────
  async register({ name, email, password }) {
    // 1. Cek apakah email sudah terdaftar
    const existing = await userRepo.findByEmail(email);
    if (existing) {
      const err = new Error('Email sudah terdaftar.');
      err.statusCode = 409;
      err.code = 'DUPLICATE_EMAIL';
      throw err;
    }

    // 2. Hash password dengan argon2id
    const hashedPassword = await argon2.hash(password, ARGON2_OPTIONS);

    // 3. Simpan user baru ke database
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return user;
  },

  // ─── LOGIN ─────────────────────────────────────────────
  async login({ email, password }) {
    // 1. Cari user by email (termasuk password untuk verifikasi)
    const user = await userRepo.findByEmail(email);

    // 2. Jika user tidak ada — gunakan pesan generik untuk mencegah user enumeration
    if (!user) {
      const err = new Error('Email atau password salah.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    // 3. Verifikasi password dengan argon2
    let isValid = false;
    try {
      isValid = await argon2.verify(user.password, password);
    } catch (e) {
      // Akan masuk ke sini jika format user.password di DB tidak valid (misal seed data lama)
      isValid = false;
    }
    
    if (!isValid) {
      const err = new Error('Email atau password salah.');
      err.statusCode = 401;
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    // 4. Generate token
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role, // ← Tambahkan role di payload
    });

    // 5. Buat refresh token (long-lived: 7 hari)
    const refreshToken = signRefreshToken({ userId: user.id });

    // 6. Simpan refresh token ke database
    await refreshTokenRepo.create({
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiry(),
    });

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
      accessToken,
      refreshToken,
    };
  },

  // ─── REFRESH TOKEN ─────────────────────────────────────
  async refresh(tokenString) {
    // 1. Verifikasi JWT signature dan expiry
    let payload;
    try {
      payload = jwt.verify(tokenString, config.jwt.refreshSecret);
    } catch (e) {
      const err = new Error('Refresh token tidak valid atau sudah expired.');
      err.statusCode = 401; err.code = 'INVALID_REFRESH_TOKEN';
      throw err;
    }

    // 2. Cek apakah token ada dan valid di database
    const storedToken = await refreshTokenRepo.findByToken(tokenString);

    // 3. REUSE DETECTION: token ada di DB tapi sudah di-revoke!
    // Ini tanda ada penyerang yang menggunakan token lama.
    if (storedToken && storedToken.isRevoked) {
      // Revoke SEMUA token milik user ini sebagai tindakan pencegahan
      await refreshTokenRepo.revokeAllByUser(storedToken.userId);
      const err = new Error('Token mencurigakan terdeteksi. Silakan login ulang.');
      err.statusCode = 401; err.code = 'TOKEN_REUSE_DETECTED';
      throw err;
    }

    // 4. Token tidak ditemukan di DB (mungkin sudah di-delete atau tidak valid)
    if (!storedToken) {
      const err = new Error('Refresh token tidak ditemukan.');
      err.statusCode = 401; err.code = 'INVALID_REFRESH_TOKEN';
      throw err;
    }

    // 5. ROTATION: Revoke token lama
    await refreshTokenRepo.revoke(tokenString);

    // 6. Buat token baru
    const newAccessToken = signAccessToken({ userId: storedToken.userId, email: storedToken.user.email });
    const newRefreshToken = signRefreshToken({ userId: storedToken.userId });

    // 7. Simpan refresh token baru
    await refreshTokenRepo.create({
      token: newRefreshToken,
      userId: storedToken.userId,
      expiresAt: getRefreshTokenExpiry(),
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  // ─── LOGOUT ────────────────────────────────────────────
  async logout(tokenString) {
    if (!tokenString) return;
    await refreshTokenRepo.revoke(tokenString);
  },
};

module.exports = authService;
