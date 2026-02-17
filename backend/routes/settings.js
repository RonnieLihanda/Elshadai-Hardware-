const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const authenticateToken = require('../middleware/auth');
const adminOnly = require('../middleware/admin');

const dbPath = path.join(__dirname, '../elshadai.db');
const db = new sqlite3.Database(dbPath);

// Get all settings (admin only)
router.get('/', authenticateToken, adminOnly, (req, res) => {
    db.all('SELECT key, value FROM settings', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Update setting (admin only)
router.put('/:key', authenticateToken, adminOnly, (req, res) => {
    const { key } = req.params;
    const { value } = req.body;

    db.run(
        'UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
        [value, key],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Setting not found' });
            res.json({ success: true, key, value });
        }
    );
});

module.exports = router;
