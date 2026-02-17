const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');
const adminOnly = require('../middleware/admin');

const excelSync = require('../utils/excelSync');
const { logInventoryChange } = require('../utils/inventoryAudit');

// Helper function to sync all products to Excel
const triggerExcelSync = async () => {
    try {
        const { rows } = await db.query('SELECT * FROM products');
        excelSync.syncInventory(rows);
    } catch (err) {
        console.error('Excel sync products fetch error:', err.message);
    }
};

// Search products
router.get('/search', authenticateToken, async (req, res) => {
    const query = req.query.q || '';
    const sql = `SELECT * FROM products WHERE item_code ILIKE $1 OR description ILIKE $2 LIMIT 20`;
    const params = [`%${query}%`, `%${query}%`];

    try {
        const { rows } = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Get all products (paginated)
router.get('/', authenticateToken, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;
    const lowStock = req.query.lowStock === 'true';

    let sql = `SELECT * FROM products`;
    let params = [];

    if (lowStock) {
        sql += ` WHERE quantity <= low_stock_threshold`;
    }

    sql += ` ORDER BY description ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    try {
        const { rows } = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Update product (admin only)
router.put('/:id', authenticateToken, adminOnly, async (req, res) => {
    const { description, quantity, buying_price, regular_price, discount_price, low_stock_threshold } = req.body;

    // Validation
    if (!description || description.trim() === '') return res.status(400).json({ error: 'Description is required' });
    if (isNaN(quantity) || quantity < 0) return res.status(400).json({ error: 'Quantity must be a positive number' });
    if (isNaN(buying_price) || buying_price < 0) return res.status(400).json({ error: 'Buying price must be a positive number' });
    if (isNaN(regular_price) || regular_price < 0) return res.status(400).json({ error: 'Regular price must be a positive number' });
    if (isNaN(discount_price) || discount_price < 0) return res.status(400).json({ error: 'Discount price must be a positive number' });

    const profit_per_item = regular_price - buying_price;

    try {
        const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
        const oldProduct = rows[0];
        if (!oldProduct) return res.status(404).json({ error: 'Product not found' });

        await db.query(
            `UPDATE products 
             SET description = $1, quantity = $2, buying_price = $3, regular_price = $4, 
                 discount_price = $5, profit_per_item = $6, low_stock_threshold = $7,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $8`,
            [description, quantity, buying_price, regular_price, discount_price,
                profit_per_item, low_stock_threshold, req.params.id]
        );

        if (oldProduct.quantity !== parseInt(quantity)) {
            logInventoryChange(
                req.params.id,
                oldProduct.item_code,
                description,
                'EDIT',
                parseInt(quantity) - oldProduct.quantity,
                oldProduct.quantity,
                parseInt(quantity),
                req.user.id,
                'Manual edit'
            );
        }

        // Sync Excel in background
        triggerExcelSync();

        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new product (admin only)
router.post('/', authenticateToken, adminOnly, async (req, res) => {
    const { item_code, description, quantity, buying_price, regular_price, discount_price, low_stock_threshold } = req.body;

    // Validation
    if (!item_code || item_code.trim() === '') return res.status(400).json({ error: 'Item code is required' });
    if (!description || description.trim() === '') return res.status(400).json({ error: 'Description is required' });
    if (isNaN(quantity) || quantity < 0) return res.status(400).json({ error: 'Quantity must be a positive number' });
    if (isNaN(buying_price) || buying_price < 0) return res.status(400).json({ error: 'Buying price must be a positive number' });
    if (isNaN(regular_price) || regular_price < 0) return res.status(400).json({ error: 'Regular price must be a positive number' });
    if (isNaN(discount_price) || discount_price < 0) return res.status(400).json({ error: 'Discount price must be a positive number' });

    const profit_per_item = regular_price - buying_price;

    try {
        const { rows } = await db.query(
            `INSERT INTO products (item_code, description, quantity, buying_price, regular_price, 
                                discount_price, profit_per_item, low_stock_threshold, discount_threshold)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 7) RETURNING id`,
            [item_code, description, quantity, buying_price, regular_price, discount_price,
                profit_per_item, low_stock_threshold || 5]
        );

        const productId = rows[0].id;
        logInventoryChange(
            productId,
            item_code,
            description,
            'RESTOCK',
            parseInt(quantity),
            0,
            parseInt(quantity),
            req.user.id,
            'Initial stock'
        );

        // Sync Excel in background
        triggerExcelSync();

        res.status(201).json({ id: productId, message: 'Product added successfully' });
    } catch (err) {
        if (err.message.includes('unique constraint') || err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Item code already exists' });
        }
        return res.status(500).json({ error: 'Failed to add product' });
    }
});

// Delete product (admin only)
router.delete('/:id', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT COUNT(*) as count FROM sale_items WHERE product_id = $1', [req.params.id]);
        const count = parseInt(rows[0].count);

        if (count > 0) {
            return res.status(400).json({
                error: 'Cannot delete product with sales history',
                salesCount: count
            });
        }

        const result = await db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Product not found' });

        // Sync Excel in background
        triggerExcelSync();

        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Check if product has sales history (admin only)
router.get('/:id/has-sales', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { rows } = await db.query('SELECT COUNT(*) as count FROM sale_items WHERE product_id = $1', [req.params.id]);
        res.json({
            hasSales: parseInt(rows[0].count) > 0,
            salesCount: parseInt(rows[0].count)
        });
    } catch (err) {
        return res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
