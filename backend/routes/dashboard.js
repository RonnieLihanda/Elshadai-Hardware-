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
    console.log(`=== DASHBOARD STATS REQUEST: ${period} ===`);

    let dateFilter = "date(created_at) = date('now')";
    if (period === 'week') {
        dateFilter = "created_at >= date('now', '-7 days')";
    } else if (period === 'month') {
        dateFilter = "created_at >= date('now', '-30 days')";
    } else if (period === 'all') {
        dateFilter = "1=1";
    }

    const statsSql = `
        SELECT 
            SUM(total_amount) as totalSales,
            SUM(total_profit) as totalProfit,
            COUNT(id) as transactionCount
        FROM sales 
        WHERE ${dateFilter}
    `;

    const lowStockSql = `SELECT COUNT(*) as count FROM products WHERE quantity <= low_stock_threshold`;
    const inventoryValueSql = `SELECT SUM(quantity * regular_price) as totalValue FROM products`;
    const topProductsSql = `
        SELECT si.description, si.item_code, SUM(si.quantity) as totalSold
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE ${dateFilter.replace('created_at', 's.created_at')}
        GROUP BY si.product_id
        ORDER BY totalSold DESC
        LIMIT 5
    `;

    db.get(statsSql, (err, stats) => {
        if (err) {
            console.error('Stats SQL error:', err);
            return res.status(500).json({ error: err.message });
        }

        db.get(lowStockSql, (err, lowStock) => {
            if (err) {
                console.error('Low Stock SQL error:', err);
                return res.status(500).json({ error: err.message });
            }

            db.get(inventoryValueSql, (err, inventory) => {
                if (err) {
                    console.error('Inventory Value SQL error:', err);
                    return res.status(500).json({ error: err.message });
                }

                db.all(topProductsSql, (err, topProducts) => {
                    if (err) {
                        console.error('Top Products SQL error:', err);
                        return res.status(500).json({ error: err.message });
                    }

                    const response = {
                        totalSales: stats.totalSales || 0,
                        totalProfit: stats.totalProfit || 0,
                        transactionCount: stats.transactionCount || 0,
                        lowStockCount: lowStock.count || 0,
                        totalInventoryValue: inventory.totalValue || 0,
                        topProducts: topProducts || []
                    };

                    console.log('Dashboard response prepared successfully');
                    res.json(response);
                });
            });
        });
    });
});

router.get('/product-performance', authenticateToken, adminOnly, (req, res) => {
    const period = req.query.period || 'today';

    let dateFilter = "date(s.created_at) = date('now')";
    if (period === 'week') {
        dateFilter = "s.created_at >= date('now', '-7 days')";
    } else if (period === 'month') {
        dateFilter = "s.created_at >= date('now', '-30 days')";
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
        GROUP BY si.product_id
        ORDER BY total_sold DESC
        LIMIT 10
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

module.exports = router;
