const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const authenticateToken = require('../middleware/auth');
const excelSync = require('../utils/excelSync');

const dbPath = path.join(__dirname, '../elshadai.db');
const db = new sqlite3.Database(dbPath);

// Create a new sale
router.post('/', authenticateToken, (req, res) => {
    const { items, total_amount, total_profit } = req.body;
    const seller_id = req.user.id;
    const receipt_number = `RCP-${Date.now()}`;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No items in cart' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const salesSql = `INSERT INTO sales (receipt_number, seller_id, total_amount, total_profit, items_count) VALUES (?, ?, ?, ?, ?)`;
        db.run(salesSql, [receipt_number, seller_id, total_amount, total_profit, items.length], function (err) {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
            }

            const sale_id = this.lastID;
            const itemStmt = db.prepare(`INSERT INTO sale_items (sale_id, product_id, item_code, description, quantity, unit_price, total_price, profit, discount_applied) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            const updateProductStmt = db.prepare(`UPDATE products SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);

            let transactionError = null;

            // In a real app we would verify prices against DB here. 
            // For now we trust the frontend's calculation but we'll include the discount_applied flag
            items.forEach(item => {
                const discount_applied = item.quantity >= (item.discount_threshold || 7) ? 1 : 0;

                itemStmt.run([
                    sale_id,
                    item.product_id,
                    item.item_code,
                    item.description,
                    item.quantity,
                    item.unit_price,
                    item.total_price,
                    item.profit,
                    discount_applied
                ], (err) => {
                    if (err) transactionError = err;
                });

                updateProductStmt.run([item.quantity, item.product_id], (err) => {
                    if (err) transactionError = err;
                });
            });

            itemStmt.finalize();
            updateProductStmt.finalize();

            if (transactionError) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: transactionError.message });
            }

            db.run('COMMIT', (err) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                // Prepare receipt data
                const receiptData = {
                    receipt_number,
                    seller: req.user.fullName,
                    items: items.map(item => ({
                        ...item,
                        discount_applied: item.quantity >= (item.discount_threshold || 7)
                    })),
                    total_amount,
                    created_at: new Date().toISOString()
                };

                // Persist receipt data
                db.run(`INSERT INTO receipts (receipt_number, sale_id, receipt_data) VALUES (?, ?, ?)`,
                    [receipt_number, sale_id, JSON.stringify(receiptData)],
                    (err) => {
                        if (err) console.error('Error persisting receipt:', err.message);
                    }
                );

                // Trigger background Excel sync
                excelSync.syncSale(receipt_number, req.user.fullName, items, total_amount);

                res.status(201).json({
                    id: sale_id,
                    receipt_number,
                    message: 'Sale completed successfully'
                });
            });
        });
    });
});

// Get sales history
router.get('/', authenticateToken, (req, res) => {
    const startDate = req.query.startDate || '1970-01-01';
    const endDate = req.query.endDate || '2100-12-31';
    const seller_id = req.query.seller_id;

    let sql = `SELECT s.*, u.full_name as seller_name FROM sales s JOIN users u ON s.seller_id = u.id WHERE DATE(s.created_at) BETWEEN ? AND ?`;
    let params = [startDate, endDate];

    if (seller_id) {
        sql += ` AND s.seller_id = ?`;
        params.push(seller_id);
    }

    sql += ` ORDER BY s.created_at DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Get sale details
router.get('/:id', authenticateToken, (req, res) => {
    const sql = `SELECT si.* FROM sale_items si WHERE si.sale_id = ?`;
    db.all(sql, [req.params.id], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

module.exports = router;
