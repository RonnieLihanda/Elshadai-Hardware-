const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const authenticateToken = require('../middleware/auth');
const adminOnly = require('../middleware/admin');

// List all users (admin only)
router.get('/', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { rows } = await db.query(`SELECT id, username, full_name, role, is_active, created_at FROM users`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Change user password (admin only)
router.put('/:id/password', authenticateToken, adminOnly, async (req, res) => {
    const { new_password } = req.body;
    const { id } = req.params;

    if (!new_password || new_password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    try {
        const password_hash = await bcrypt.hash(new_password, 10);
        const result = await db.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [password_hash, id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
