const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');
const adminOnly = require('../middleware/admin');

// List all receipts (admin only)
router.get('/', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { rows } = await db.query(`SELECT * FROM receipts ORDER BY created_at DESC`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get specific receipt by receipt_number
router.get('/:receipt_number', authenticateToken, async (req, res) => {
    try {
        const { rows } = await db.query(`SELECT * FROM receipts WHERE receipt_number = $1`, [req.params.receipt_number]);
        const row = rows[0];
        if (!row) return res.status(404).json({ message: 'Receipt not found' });
        res.json(JSON.parse(row.receipt_data));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
