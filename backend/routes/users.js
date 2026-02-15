const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const authenticateToken = require('../middleware/auth');
const adminOnly = require('../middleware/admin');

const dbPath = path.join(__dirname, '../elshadai.db');
const db = new sqlite3.Database(dbPath);

// List all users (admin only)
router.get('/', authenticateToken, adminOnly, (req, res) => {
    db.all(`SELECT id, username, full_name, role, is_active, created_at FROM users`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
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
        db.run(`UPDATE users SET password_hash = ? WHERE id = ?`, [password_hash, id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ message: 'User not found' });
            res.json({ message: 'Password updated successfully' });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
