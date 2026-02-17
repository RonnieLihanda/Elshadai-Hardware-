const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const authenticateToken = require('../middleware/auth');
const adminOnly = require('../middleware/admin');

const dbPath = path.join(__dirname, '../elshadai.db');
const db = new sqlite3.Database(dbPath);

// Get audit logs (admin only)
router.get('/', authenticateToken, adminOnly, (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const { itemCode, type } = req.query;

    let sql = `
        SELECT a.*, u.full_name as user_name 
        FROM inventory_audit a 
        LEFT JOIN users u ON a.user_id = u.id 
        WHERE 1=1
    `;
    const params = [];

    if (itemCode) {
        sql += ` AND a.item_code = ?`;
        params.push(itemCode);
    }
    if (type && type !== 'all') {
        sql += ` AND a.change_type = ?`;
        params.push(type);
    }

    sql += ` ORDER BY a.created_at DESC LIMIT ?`;
    params.push(limit);

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;
