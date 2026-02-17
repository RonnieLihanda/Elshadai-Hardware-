const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

// Admin-only middleware check
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Lookup customer by phone
router.get('/lookup', authenticateToken, async (req, res) => {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });

    let cleanPhone = phone.replace(/\s+/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.slice(1);

    try {
        const { rows } = await db.query('SELECT * FROM customers WHERE phone_number = $1', [cleanPhone]);
        const customer = rows[0];
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.json(customer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all customers (Admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    const { minPurchases } = req.query;
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (minPurchases) {
        sql += ' AND mpesa_purchases_count >= $1';
        params.push(parseInt(minPurchases));
    }

    sql += ' ORDER BY total_spent DESC';

    try {
        const { rows } = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update customer discount eligibility (Admin only)
router.put('/:id/discount', authenticateToken, requireAdmin, async (req, res) => {
    const { is_eligible, discount_percentage } = req.body;
    try {
        const result = await db.query(
            'UPDATE customers SET is_eligible_for_discount = $1, discount_percentage = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
            [is_eligible, discount_percentage || 0, req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Customer not found' });
        res.json({ message: 'Discount updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get customer purchase history (Admin only)
router.get('/:id/purchases', authenticateToken, requireAdmin, async (req, res) => {
    const sql = `
        SELECT s.*, u.full_name as seller_name 
        FROM sales s 
        JOIN users u ON s.seller_id = u.id 
        WHERE s.customer_id = $1 
        ORDER BY s.created_at DESC`;

    try {
        const { rows } = await db.query(sql, [req.params.id]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
