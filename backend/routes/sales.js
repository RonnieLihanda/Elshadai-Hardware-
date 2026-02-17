const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const authenticateToken = require('../middleware/auth');
const excelSync = require('../utils/excelSync');
const { logInventoryChange } = require('../utils/inventoryAudit');

const dbPath = path.join(__dirname, '../elshadai.db');
const db = new sqlite3.Database(dbPath);

// Create a new sale
router.post('/', authenticateToken, async (req, res) => {
    console.log('=== SALE REQUEST RECEIVED ===');
    console.log('Body:', JSON.stringify(req.body, null, 2));

    const { items, total_amount, total_profit, payment_method, mpesa_reference, customer_phone, manual_discount = 0 } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Sale must contain at least one item' });
    }
    if (isNaN(total_amount) || total_amount < 0) {
        return res.status(400).json({ error: 'Invalid total amount' });
    }
    if (isNaN(manual_discount) || manual_discount < 0) {
        return res.status(400).json({ error: 'Invalid manual discount' });
    }

    const seller_id = req.user.id;
    const receipt_number = `RCP-${Date.now()}`;

    if (!items || items.length === 0) {
        console.log('ERROR: No items in cart');
        return res.status(400).json({ error: 'No items in cart' });
    }

    // Validate payment method
    if (!['cash', 'mpesa'].includes(payment_method)) {
        return res.status(400).json({ error: 'Invalid payment method' });
    }

    // If M-Pesa, require phone number (optional: based on UI preference, but good practice)
    if (payment_method === 'mpesa' && !customer_phone) {
        return res.status(400).json({ error: 'Phone number required for M-Pesa' });
    }

    try {
        const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve(this);
            });
        });

        const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        // 1. Verify Stock & Prepare Items
        console.log(`Verifying stock for ${items.length} items...`);
        const processedItems = [];
        for (const item of items) {
            const product = await dbGet('SELECT * FROM products WHERE id = ?', [item.product_id || item.id]);
            if (!product) throw new Error(`Product not found: ${item.description}`);
            if (product.quantity < item.quantity) throw new Error(`Insufficient stock for ${product.description}.`);

            processedItems.push({
                ...item,
                product_id: product.id,
                item_code: product.item_code,
                description: product.description,
                buying_price: product.buying_price,
                discount_applied: item.quantity >= (product.discount_threshold || 7)
            });
        }

        // 2. Handle Customer for M-Pesa
        let customerId = null;
        let customerDiscountPercent = 0;
        let cleanPhone = null;

        if (customer_phone) {
            cleanPhone = customer_phone.replace(/\s+/g, '');
            if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.slice(1);

            let customer = await dbGet('SELECT * FROM customers WHERE phone_number = ?', [cleanPhone]);

            if (customer) {
                customerId = customer.id;
                if (customer.is_eligible_for_discount) customerDiscountPercent = customer.discount_percentage;
            } else {
                // Create new customer
                const custRes = await dbRun(
                    'INSERT INTO customers (phone_number, created_at) VALUES (?, datetime("now"))',
                    [cleanPhone]
                );
                customerId = custRes.lastID;
            }
        }

        // Apply customer discount if any
        let discountAmount = 0;
        let finalTotal = total_amount;
        let finalProfit = total_profit;

        if (customerDiscountPercent > 0) {
            discountAmount = (total_amount * customerDiscountPercent) / 100;
            finalTotal = total_amount - discountAmount;
            finalProfit = total_profit - discountAmount;
        }

        // 3. Start Transaction
        console.log('Stock verified. Starting transaction...');
        await dbRun('BEGIN TRANSACTION');

        try {
            // Insert Sale
            const saleRes = await dbRun(
                `INSERT INTO sales (receipt_number, seller_id, customer_id, payment_method, mpesa_reference, total_amount, total_profit, items_count, manual_discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [receipt_number, seller_id, customerId, payment_method, mpesa_reference, finalTotal, finalProfit, items.length, manual_discount]
            );
            const sale_id = saleRes.lastID;

            // Insert Items and Update Stock
            for (const item of processedItems) {
                await dbRun(
                    `INSERT INTO sale_items (sale_id, product_id, item_code, description, quantity, unit_price, total_price, profit, discount_applied) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [sale_id, item.product_id, item.item_code, item.description, item.quantity, item.unit_price, item.total_price, item.profit, item.discount_applied ? 1 : 0]
                );
                await dbRun(`UPDATE products SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [item.quantity, item.product_id]);

                // Audit log
                const product = await dbGet('SELECT quantity FROM products WHERE id = ?', [item.product_id]);
                logInventoryChange(
                    item.product_id,
                    item.item_code,
                    item.description,
                    'SALE',
                    -item.quantity,
                    product.quantity + item.quantity,
                    product.quantity,
                    seller_id,
                    `Sale ${receipt_number}`
                );
            }

            // Record customer discount if applied
            if (discountAmount > 0 && customerId) {
                await dbRun(
                    'INSERT INTO customer_discounts (customer_id, sale_id, discount_amount, discount_percentage) VALUES (?, ?, ?, ?)',
                    [customerId, sale_id, discountAmount, customerDiscountPercent]
                );
            }

            // Update customer stats
            if (customerId) {
                const mpesa_inc = payment_method === 'mpesa' ? 1 : 0;
                const mpesa_spent = payment_method === 'mpesa' ? finalTotal : 0;
                await dbRun(
                    `UPDATE customers 
                     SET mpesa_purchases_count = mpesa_purchases_count + ?, 
                         total_mpesa_spent = total_mpesa_spent + ?,
                         total_purchases_count = total_purchases_count + 1,
                         total_spent = total_spent + ?,
                         last_purchase_at = datetime('now')
                     WHERE id = ?`,
                    [mpesa_inc, mpesa_spent, finalTotal, customerId]
                );
            }

            await dbRun('COMMIT');
            console.log('Transaction committed.');

            // Post-sale background tasks
            const receiptData = {
                receipt_number,
                seller_name: req.user.full_name,
                items: processedItems,
                total_amount: finalTotal,
                original_amount: total_amount,
                discount_amount: discountAmount,
                discount_percentage: customerDiscountPercent,
                payment_method,
                mpesa_reference,
                customer_phone: cleanPhone,
                created_at: new Date().toISOString()
            };

            db.run(`INSERT INTO receipts (receipt_number, sale_id, receipt_data) VALUES (?, ?, ?)`,
                [receipt_number, sale_id, JSON.stringify(receiptData)],
                (err) => { if (err) console.error('Receipt persist error:', err); }
            );

            excelSync.syncSale(receipt_number, req.user.full_name, processedItems, finalTotal);

            res.status(201).json({
                id: sale_id,
                receipt_number,
                message: 'Sale completed successfully',
                ...receiptData
            });

        } catch (err) {
            console.error('Transaction failed, rolling back:', err.message);
            await dbRun('ROLLBACK');
            throw err;
        }

    } catch (error) {
        console.error('=== SALE FAILED ===', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get sales history with filters
router.get('/', authenticateToken, (req, res) => {
    const { startDate, endDate, paymentMethod, search } = req.query;

    let sql = `
        SELECT 
            s.*, 
            u.full_name as seller_name,
            c.phone_number as customer_phone
        FROM sales s 
        JOIN users u ON s.seller_id = u.id 
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE 1=1
    `;
    const params = [];

    if (startDate) {
        sql += ` AND DATE(s.created_at) >= ?`;
        params.push(startDate);
    }

    if (endDate) {
        sql += ` AND DATE(s.created_at) <= ?`;
        params.push(endDate);
    }

    if (paymentMethod && paymentMethod !== 'all') {
        sql += ` AND s.payment_method = ?`;
        params.push(paymentMethod);
    }

    if (search) {
        sql += ` AND (s.receipt_number LIKE ? OR c.phone_number LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY s.created_at DESC LIMIT 500`;

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
