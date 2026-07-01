const authService = require('../services/auth.service');

// POST /auth/register
const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({
      message: 'Registrasi berhasil.',
      data: user,
    });
  } catch (err) { next(err); }
};

// POST /auth/login
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({
      message: 'Login berhasil.',
      data: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (err) { next(err); }
};

// POST /auth/refresh
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refresh(refreshToken);
    res.status(200).json({
      message: 'Token berhasil diperbarui.',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (err) { next(err); }
};

// POST /auth/logout
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.status(200).json({ message: 'Logout berhasil.' });
  } catch (err) { next(err); }
};

const userRepo = require('../repositories/user.repository');

// GET /auth/me — informasi user yang sedang login
const me = async (req, res, next) => {
  try {
    // req.user diisi oleh authenticate middleware (berisi userId dari JWT)
    const user = await userRepo.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: { message: 'User tidak ditemukan' } });
    }
    res.status(200).json({ data: user });
  } catch (err) { next(err); }
};

module.exports = { register, login, refresh, logout, me };
