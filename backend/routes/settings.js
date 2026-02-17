const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');
const adminOnly = require('../middleware/admin');

// Get all settings (admin only)
router.get('/', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT key, value FROM settings');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update setting (admin only)
router.put('/:key', authenticateToken, adminOnly, async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;

    try {
        const result = await db.query(
            'UPDATE settings SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2',
            [value, key]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Setting not found' });
        res.json({ success: true, key, value });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
