// File: src/routes/users.routes.js
const express = require('express');
const router = express.Router();
const { getTasksByUser } = require('../controllers/tasks.controller');

/**
 * @swagger
 * /users/{userId}/tasks:
 *   get:
 *     summary: Ambil semua task milik user tertentu (JOIN query)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID user
 *     responses:
 *       200:
 *         description: Berhasil mengambil tasks user
 *       404:
 *         description: User tidak ditemukan
 */
router.get('/:userId/tasks', getTasksByUser);

module.exports = router;
