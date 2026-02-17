const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const authenticateToken = require('../middleware/auth');

const dbPath = path.join(__dirname, '../elshadai.db');
const db = new sqlite3.Database(dbPath);

// Admin-only middleware check
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Lookup customer by phone
router.get('/lookup', authenticateToken, (req, res) => {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });

    let cleanPhone = phone.replace(/\s+/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.slice(1);

    db.get('SELECT * FROM customers WHERE phone_number = ?', [cleanPhone], (err, customer) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.json(customer);
    });
});

// Get all customers (Admin only)
router.get('/', authenticateToken, requireAdmin, (req, res) => {
    const { minPurchases } = req.query;
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (minPurchases) {
        sql += ' AND mpesa_purchases_count >= ?';
        params.push(parseInt(minPurchases));
    }

    sql += ' ORDER BY total_spent DESC';

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Update customer discount eligibility (Admin only)
router.put('/:id/discount', authenticateToken, requireAdmin, (req, res) => {
    const { is_eligible, discount_percentage } = req.body;
    db.run(
        'UPDATE customers SET is_eligible_for_discount = ?, discount_percentage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [is_eligible ? 1 : 0, discount_percentage || 0, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Customer not found' });
            res.json({ message: 'Discount updated successfully' });
        }
    );
});

// Get customer purchase history (Admin only)
router.get('/:id/purchases', authenticateToken, requireAdmin, (req, res) => {
    const sql = `
        SELECT s.*, u.full_name as seller_name 
        FROM sales s 
        JOIN users u ON s.seller_id = u.id 
        WHERE s.customer_id = ? 
        ORDER BY s.created_at DESC`;

    db.all(sql, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

module.exports = router;
