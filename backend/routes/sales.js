const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');
const excelSync = require('../utils/excelSync');
const { logInventoryChange } = require('../utils/inventoryAudit');

// Create a new sale
router.post('/', authenticateToken, async (req, res) => {
    console.log('=== SALE REQUEST RECEIVED ===');
    const { items, total_amount, total_profit, payment_method, mpesa_reference, customer_phone, manual_discount = 0 } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Sale must contain at least one item' });
    }
    if (isNaN(total_amount) || total_amount < 0) {
        return res.status(400).json({ error: 'Invalid total amount' });
    }

    const seller_id = req.user.id;
    const receipt_number = `RCP-${Date.now()}`;

    // Validate payment method
    if (!['cash', 'mpesa'].includes(payment_method)) {
        return res.status(400).json({ error: 'Invalid payment method' });
    }

    if (payment_method === 'mpesa' && !customer_phone) {
        return res.status(400).json({ error: 'Phone number required for M-Pesa' });
    }

    const client = await db.pool.connect();

    try {
        // 1. Verify Stock & Prepare Items
        const processedItems = [];
        for (const item of items) {
            const { rows } = await client.query('SELECT * FROM products WHERE id = $1', [item.product_id || item.id]);
            const product = rows[0];
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

        // 2. Handle Customer
        let customerId = null;
        let customerDiscountPercent = 0;
        let cleanPhone = null;

        if (customer_phone) {
            cleanPhone = customer_phone.replace(/\s+/g, '');
            if (cleanPhone.startsWith('0')) cleanPhone = '254' + cleanPhone.slice(1);

            const { rows } = await client.query('SELECT * FROM customers WHERE phone_number = $1', [cleanPhone]);
            let customer = rows[0];

            if (customer) {
                customerId = customer.id;
                if (customer.is_eligible_for_discount) customerDiscountPercent = customer.discount_percentage;
            } else {
                const custRes = await client.query(
                    'INSERT INTO customers (phone_number, created_at) VALUES ($1, CURRENT_TIMESTAMP) RETURNING id',
                    [cleanPhone]
                );
                customerId = custRes.rows[0].id;
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
        await client.query('BEGIN');

        try {
            // Insert Sale
            const saleRes = await client.query(
                `INSERT INTO sales (receipt_number, seller_id, customer_id, payment_method, mpesa_reference, total_amount, total_profit, items_count, manual_discount) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
                [receipt_number, seller_id, customerId, payment_method, mpesa_reference, finalTotal, finalProfit, items.length, manual_discount]
            );
            const sale_id = saleRes.rows[0].id;

            // Insert Items and Update Stock
            for (const item of processedItems) {
                await client.query(
                    `INSERT INTO sale_items (sale_id, product_id, item_code, description, quantity, unit_price, total_price, profit, discount_applied) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [sale_id, item.product_id, item.item_code, item.description, item.quantity, item.unit_price, item.total_price, item.profit, item.discount_applied ? 1 : 0]
                );

                const updateRes = await client.query(
                    `UPDATE products SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING quantity`,
                    [item.quantity, item.product_id]
                );
                const newQuantity = updateRes.rows[0].quantity;

                // Audit log
                logInventoryChange(
                    item.product_id,
                    item.item_code,
                    item.description,
                    'SALE',
                    -item.quantity,
                    newQuantity + item.quantity,
                    newQuantity,
                    seller_id,
                    `Sale ${receipt_number}`
                );
            }

            if (discountAmount > 0 && customerId) {
                await client.query(
                    'INSERT INTO customer_discounts (customer_id, sale_id, discount_amount, discount_percentage) VALUES ($1, $2, $3, $4)',
                    [customerId, sale_id, discountAmount, customerDiscountPercent]
                );
            }

            if (customerId) {
                const mpesa_inc = payment_method === 'mpesa' ? 1 : 0;
                const mpesa_spent = payment_method === 'mpesa' ? finalTotal : 0;
                await client.query(
                    `UPDATE customers 
                     SET mpesa_purchases_count = mpesa_purchases_count + $1, 
                         total_mpesa_spent = total_mpesa_spent + $2,
                         total_purchases_count = total_purchases_count + 1,
                         total_spent = total_spent + $3,
                         last_purchase_at = CURRENT_TIMESTAMP
                     WHERE id = $4`,
                    [mpesa_inc, mpesa_spent, finalTotal, customerId]
                );
            }

            await client.query('COMMIT');

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

            await client.query(`INSERT INTO receipts (receipt_number, sale_id, receipt_data) VALUES ($1, $2, $3)`,
                [receipt_number, sale_id, JSON.stringify(receiptData)]
            );

            excelSync.syncSale(receipt_number, req.user.full_name, processedItems, finalTotal);

            res.status(201).json({
                id: sale_id,
                receipt_number,
                message: 'Sale completed successfully',
                ...receiptData
            });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }
    } catch (error) {
        console.error('=== SALE FAILED ===', error.message);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// Get sales history with filters
router.get('/', authenticateToken, async (req, res) => {
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
        sql += ` AND s.created_at::date >= $${params.length + 1}`;
        params.push(startDate);
    }

    if (endDate) {
        sql += ` AND s.created_at::date <= $${params.length + 1}`;
        params.push(endDate);
    }

    if (paymentMethod && paymentMethod !== 'all') {
        sql += ` AND s.payment_method = $${params.length + 1}`;
        params.push(paymentMethod);
    }

    if (search) {
        sql += ` AND (s.receipt_number ILIKE $${params.length + 1} OR c.phone_number ILIKE $${params.length + 2})`;
        params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY s.created_at DESC LIMIT 500`;

    try {
        const { rows } = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// Get sale details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { rows } = await db.query(`SELECT si.* FROM sale_items si WHERE si.sale_id = $1`, [req.params.id]);
        res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
