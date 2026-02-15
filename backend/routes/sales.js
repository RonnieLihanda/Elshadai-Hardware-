const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const authenticateToken = require('../middleware/auth');
const excelSync = require('../utils/excelSync');

const dbPath = path.join(__dirname, '../elshadai.db');
const db = new sqlite3.Database(dbPath);

// Create a new sale
router.post('/', authenticateToken, async (req, res) => {
    console.log('=== SALE REQUEST RECEIVED ===');
    console.log('User:', req.user.username);

    const { items, total_amount, total_profit } = req.body;
    const seller_id = req.user.id;
    const receipt_number = `RCP-${Date.now()}`;

    if (!items || items.length === 0) {
        console.log('ERROR: No items in cart');
        return res.status(400).json({ message: 'No items in cart' });
    }

    try {
        // 1. Verify all products and stock first
        console.log(`Verifying stock for ${items.length} items...`);
        const processedItems = [];

        for (const item of items) {
            const product = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM products WHERE id = ?', [item.product_id], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (!product) {
                throw new Error(`Product not found: ${item.description || item.item_code}`);
            }

            if (product.quantity < item.quantity) {
                throw new Error(`Insufficient stock for ${product.description}. Available: ${product.quantity}, Requested: ${item.quantity}`);
            }

            // Calculate/Verify info
            const discount_threshold = product.discount_threshold || 7;
            const discount_applied = item.quantity >= discount_threshold;

            processedItems.push({
                ...item,
                product_id: product.id,
                item_code: product.item_code,
                description: product.description,
                discount_applied
            });
        }

        console.log('Stock verification passed. Starting transaction...');

        // 2. Perform Transaction
        const result = await new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION', (err) => {
                    if (err) return reject(err);
                });

                const salesSql = `INSERT INTO sales (receipt_number, seller_id, total_amount, total_profit, items_count) VALUES (?, ?, ?, ?, ?)`;
                db.run(salesSql, [receipt_number, seller_id, total_amount, total_profit, items.length], function (err) {
                    if (err) {
                        db.run('ROLLBACK');
                        return reject(err);
                    }

                    const sale_id = this.lastID;
                    console.log(`Sale created with ID: ${sale_id}. Processing items...`);

                    const itemSql = `INSERT INTO sale_items (sale_id, product_id, item_code, description, quantity, unit_price, total_price, profit, discount_applied) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    const updateSql = `UPDATE products SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

                    let itemsProcessed = 0;
                    let hasError = false;

                    processedItems.forEach((item) => {
                        if (hasError) return;

                        db.run(itemSql, [
                            sale_id, item.product_id, item.item_code, item.description,
                            item.quantity, item.unit_price, item.total_price, item.profit,
                            item.discount_applied ? 1 : 0
                        ], (err) => {
                            if (err && !hasError) {
                                hasError = true;
                                db.run('ROLLBACK');
                                return reject(new Error(`Failed to insert sale item ${item.item_code}: ${err.message}`));
                            }

                            db.run(updateSql, [item.quantity, item.product_id], (err) => {
                                if (err && !hasError) {
                                    hasError = true;
                                    db.run('ROLLBACK');
                                    return reject(new Error(`Failed to update stock for ${item.item_code}: ${err.message}`));
                                }

                                itemsProcessed++;
                                if (itemsProcessed === processedItems.length && !hasError) {
                                    db.run('COMMIT', (err) => {
                                        if (err) {
                                            db.run('ROLLBACK');
                                            return reject(err);
                                        }
                                        console.log('Transaction committed successfully');
                                        resolve({ sale_id, receipt_number });
                                    });
                                }
                            });
                        });
                    });
                });
            });
        });

        console.log('=== SALE COMPLETED SUCCESSFULLY ===');

        // 3. Post-transaction operations
        // Prepare receipt data
        const receiptData = {
            receipt_number: result.receipt_number,
            seller: req.user.fullName,
            items: processedItems,
            total_amount,
            created_at: new Date().toISOString()
        };

        // Persist receipt data in background
        db.run(`INSERT INTO receipts (receipt_number, sale_id, receipt_data) VALUES (?, ?, ?)`,
            [result.receipt_number, result.sale_id, JSON.stringify(receiptData)],
            (err) => { if (err) console.error('Error persisting receipt:', err.message); }
        );

        // Sync Excel in background
        excelSync.syncSale(result.receipt_number, req.user.fullName, processedItems, total_amount);

        res.status(201).json({
            id: result.sale_id,
            receipt_number: result.receipt_number,
            message: 'Sale completed successfully'
        });

    } catch (error) {
        console.error('=== SALE FAILED ===');
        console.error('Error:', error.message);
        res.status(500).json({ error: error.message });
    }
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
