const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const authenticateToken = require('../middleware/auth');
const adminOnly = require('../middleware/admin');

const dbPath = path.join(__dirname, '../elshadai.db');
const db = new sqlite3.Database(dbPath);

router.get('/stats', authenticateToken, adminOnly, (req, res) => {
    const period = req.query.period || 'today';
    let dateFilter = "date('now')";

    if (period === 'week') {
        dateFilter = "date('now', 'weekday 0', '-7 days')";
    } else if (period === 'month') {
        dateFilter = "date('now', 'start of month')";
    }

    const statsSql = `
        SELECT 
            SUM(total_amount) as totalSales,
            SUM(total_profit) as totalProfit,
            COUNT(id) as transactionCount
        FROM sales 
        WHERE created_at >= ${period === 'today' ? "date('now')" : dateFilter}
    `;

    const inventorySql = `
        SELECT 
            COUNT(*) as lowStockCount,
            SUM(quantity * selling_price) as totalInventoryValue
        FROM products
        WHERE quantity <= low_stock_threshold OR 1=1 -- For total value
    `;

    // Special query for low stock count only
    const lowStockSql = `SELECT COUNT(*) as count FROM products WHERE quantity <= low_stock_threshold`;

    db.get(statsSql, (err, stats) => {
        if (err) return res.status(500).json({ error: err.message });

        db.get(lowStockSql, (err, lowStock) => {
            if (err) return res.status(500).json({ error: err.message });

            db.get(`SELECT SUM(quantity * selling_price) as totalValue FROM products`, (err, inventory) => {
                if (err) return res.status(500).json({ error: err.message });

                db.all(`
                    SELECT description, item_code, SUM(quantity) as totalSold
                    FROM sale_items
                    GROUP BY product_id
                    ORDER BY totalSold DESC
                    LIMIT 5
                `, (err, topProducts) => {
                    if (err) return res.status(500).json({ error: err.message });

                    res.json({
                        totalSales: stats.totalSales || 0,
                        totalProfit: stats.totalProfit || 0,
                        transactionCount: stats.transactionCount || 0,
                        lowStockCount: lowStock.count || 0,
                        totalInventoryValue: inventory.totalValue || 0,
                        topProducts: topProducts
                    });
                });
            });
        });
    });
});

module.exports = router;
