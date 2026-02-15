const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const authenticateToken = require('../middleware/auth');
const adminOnly = require('../middleware/admin');

const dbPath = path.join(__dirname, '../elshadai.db');
const db = new sqlite3.Database(dbPath);

// List all receipts (admin only)
router.get('/', authenticateToken, adminOnly, (req, res) => {
    db.all(`SELECT * FROM receipts ORDER BY created_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Get specific receipt by receipt_number
router.get('/:receipt_number', authenticateToken, (req, res) => {
    db.get(`SELECT * FROM receipts WHERE receipt_number = ?`, [req.params.receipt_number], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ message: 'Receipt not found' });
        res.json(JSON.parse(row.receipt_data));
    });
});

module.exports = router;
