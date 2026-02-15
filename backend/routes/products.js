const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const authenticateToken = require('../middleware/auth');
const adminOnly = require('../middleware/admin');

const dbPath = path.join(__dirname, '../elshadai.db');
const db = new sqlite3.Database(dbPath);

// Search products
router.get('/search', authenticateToken, (req, res) => {
    const query = req.query.q || '';
    const sql = `SELECT * FROM products WHERE item_code LIKE ? OR description LIKE ? LIMIT 20`;
    const params = [`%${query}%`, `%${query}%`];

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get all products (paginated)
router.get('/', authenticateToken, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;
    const lowStock = req.query.lowStock === 'true';

    let sql = `SELECT * FROM products`;
    let params = [];

    if (lowStock) {
        sql += ` WHERE quantity <= low_stock_threshold`;
    }

    sql += ` ORDER BY description ASC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get single product
router.get('/:id', authenticateToken, (req, res) => {
    db.get(`SELECT * FROM products WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(row);
    });
});

// Update product (admin only)
router.put('/:id', authenticateToken, adminOnly, (req, res) => {
    const { description, quantity, buying_price, regular_price, discount_price, low_stock_threshold } = req.body;

    // Calculate profit
    const profit_per_item = regular_price - buying_price;

    db.run(
        `UPDATE products 
       SET description = ?, quantity = ?, buying_price = ?, regular_price = ?, 
           discount_price = ?, profit_per_item = ?, low_stock_threshold = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
        [description, quantity, buying_price, regular_price, discount_price,
            profit_per_item, low_stock_threshold, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: 'Failed to update product' });
            if (this.changes === 0) return res.status(404).json({ error: 'Product not found' });
            res.json({ message: 'Product updated successfully' });
        }
    );
});

// Add new product (admin only)
router.post('/', authenticateToken, adminOnly, (req, res) => {
    const { item_code, description, quantity, buying_price, regular_price, discount_price, low_stock_threshold } = req.body;

    const profit_per_item = regular_price - buying_price;

    db.run(
        `INSERT INTO products (item_code, description, quantity, buying_price, regular_price, 
                            discount_price, profit_per_item, low_stock_threshold, discount_threshold)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 7)`,
        [item_code, description, quantity, buying_price, regular_price, discount_price,
            profit_per_item, low_stock_threshold || 5],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Item code already exists' });
                }
                return res.status(500).json({ error: 'Failed to add product' });
            }
            res.status(201).json({ id: this.lastID, message: 'Product added successfully' });
        }
    );
});

// Delete product (admin only)
router.delete('/:id', authenticateToken, adminOnly, (req, res) => {
    // First check if product has sales
    db.get(
        'SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?',
        [req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            if (result.count > 0) {
                return res.status(400).json({
                    error: 'Cannot delete product with sales history',
                    salesCount: result.count
                });
            }

            // No sales, safe to delete
            db.run('DELETE FROM products WHERE id = ?', [req.params.id], function (err) {
                if (err) return res.status(500).json({ error: 'Failed to delete product' });
                if (this.changes === 0) return res.status(404).json({ error: 'Product not found' });
                res.json({ message: 'Product deleted successfully' });
            });
        }
    );
});

// Check if product has sales history (admin only)
router.get('/:id/has-sales', authenticateToken, adminOnly, (req, res) => {
    db.get(
        'SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?',
        [req.params.id],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({
                hasSales: result.count > 0,
                salesCount: result.count
            });
        }
    );
});

module.exports = router;
