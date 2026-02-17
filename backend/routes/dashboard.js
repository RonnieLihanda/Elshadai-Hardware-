const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');
const adminOnly = require('../middleware/admin');

router.get('/stats', authenticateToken, adminOnly, async (req, res) => {
    const period = req.query.period || 'today';
    console.log(`=== DASHBOARD STATS REQUEST: ${period} ===`);

    let dateFilter = "created_at::date = CURRENT_DATE";
    if (period === 'week') {
        dateFilter = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (period === 'month') {
        dateFilter = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
    } else if (period === 'all') {
        dateFilter = "1=1";
    }

    try {
        const statsSql = `
            SELECT 
                SUM(total_amount) as "totalSales",
                SUM(total_profit) as "totalProfit",
                COUNT(id) as "transactionCount"
            FROM sales 
            WHERE ${dateFilter}
        `;

        const lowStockSql = `SELECT COUNT(*) as count FROM products WHERE quantity <= low_stock_threshold`;
        const inventoryValueSql = `SELECT SUM(quantity * regular_price) as "totalValue" FROM products`;

        const topProductsSql = `
            SELECT si.description, si.item_code, SUM(si.quantity) as "totalSold"
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            WHERE ${dateFilter.replace('created_at', 's.created_at')}
            GROUP BY si.product_id, si.description, si.item_code
            ORDER BY "totalSold" DESC
            LIMIT 5
        `;

        const [statsRes, lowStockRes, inventoryRes, topProductsRes] = await Promise.all([
            db.query(statsSql),
            db.query(lowStockSql),
            db.query(inventoryValueSql),
            db.query(topProductsSql)
        ]);

        const stats = statsRes.rows[0];
        const lowStock = lowStockRes.rows[0];
        const inventory = inventoryRes.rows[0];
        const topProducts = topProductsRes.rows;

        const response = {
            totalSales: parseFloat(stats.totalSales) || 0,
            totalProfit: parseFloat(stats.totalProfit) || 0,
            transactionCount: parseInt(stats.transactionCount) || 0,
            lowStockCount: parseInt(lowStock.count) || 0,
            totalInventoryValue: parseFloat(inventory.totalValue) || 0,
            topProducts: topProducts || []
        };

        res.json(response);
    } catch (err) {
        console.error('Dashboard Stats Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.get('/product-performance', authenticateToken, adminOnly, async (req, res) => {
    const period = req.query.period || 'today';

    let dateFilter = "s.created_at::date = CURRENT_DATE";
    if (period === 'week') {
        dateFilter = "s.created_at >= CURRENT_DATE - INTERVAL '7 days'";
    } else if (period === 'month') {
        dateFilter = "s.created_at >= CURRENT_DATE - INTERVAL '30 days'";
    } else if (period === 'all') {
        dateFilter = "1=1";
    }

    const sql = `
        SELECT 
            p.description,
            p.item_code,
            p.quantity as current_stock,
            SUM(si.quantity) as total_sold,
            SUM(si.total_price) as total_revenue,
            SUM(si.profit) as total_profit
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE ${dateFilter}
        GROUP BY si.product_id, p.description, p.item_code, p.quantity
        ORDER BY total_sold DESC
        LIMIT 10
    `;

    try {
        const { rows } = await db.query(sql);
        res.json(rows);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

module.exports = router;
