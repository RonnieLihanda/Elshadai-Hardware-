const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const authenticateToken = require('../middleware/auth');
const adminOnly = require('../middleware/admin');

const excelSync = require('../utils/excelSync');
const { logInventoryChange } = require('../utils/inventoryAudit');

const dbPath = path.join(__dirname, '../elshadai.db');
const db = new sqlite3.Database(dbPath);

// Helper function to sync all products to Excel
const triggerExcelSync = () => {
    db.all('SELECT * FROM products', [], (err, rows) => {
        if (!err) {
            excelSync.syncInventory(rows);
        }
    });
};

// Search products
// ... (keep existing search route)
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
        const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        const oldProduct = await dbGet('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (!oldProduct) return res.status(404).json({ error: 'Product not found' });

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
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new product (admin only)
router.post('/', authenticateToken, adminOnly, (req, res) => {
    const { item_code, description, quantity, buying_price, regular_price, discount_price, low_stock_threshold } = req.body;

    // Validation
    if (!item_code || item_code.trim() === '') return res.status(400).json({ error: 'Item code is required' });
    if (!description || description.trim() === '') return res.status(400).json({ error: 'Description is required' });
    if (isNaN(quantity) || quantity < 0) return res.status(400).json({ error: 'Quantity must be a positive number' });
    if (isNaN(buying_price) || buying_price < 0) return res.status(400).json({ error: 'Buying price must be a positive number' });
    if (isNaN(regular_price) || regular_price < 0) return res.status(400).json({ error: 'Regular price must be a positive number' });
    if (isNaN(discount_price) || discount_price < 0) return res.status(400).json({ error: 'Discount price must be a positive number' });

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

            const productId = this.lastID;
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
        }
    );
});

// Delete product (admin only)
router.delete('/:id', authenticateToken, adminOnly, (req, res) => {
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

            db.run('DELETE FROM products WHERE id = ?', [req.params.id], function (err) {
                if (err) return res.status(500).json({ error: 'Failed to delete product' });
                if (this.changes === 0) return res.status(404).json({ error: 'Product not found' });

                // Sync Excel in background
                triggerExcelSync();

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
