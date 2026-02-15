const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const authenticateToken = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const { exportInventory } = require('../utils/excelSync');

const dbPath = path.join(__dirname, '../elshadai.db');
const db = new sqlite3.Database(dbPath);

router.get('/export', authenticateToken, adminOnly, (req, res) => {
    db.all(`SELECT * FROM products ORDER BY description ASC`, [], async (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        try {
            const workbook = await exportInventory(rows);
            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            );
            res.setHeader(
                'Content-Disposition',
                'attachment; filename=elshadai_inventory.xlsx'
            );

            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
});

module.exports = router;
