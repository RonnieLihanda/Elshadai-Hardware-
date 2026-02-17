const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');
const adminOnly = require('../middleware/admin');

// Get audit logs (admin only)
router.get('/', authenticateToken, adminOnly, async (req, res) => {
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
        sql += ` AND a.item_code = $${params.length + 1}`;
        params.push(itemCode);
    }
    if (type && type !== 'all') {
        sql += ` AND a.change_type = $${params.length + 1}`;
        params.push(type);
    }

    sql += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    try {
        const { rows } = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
