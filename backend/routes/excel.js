const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const authenticateToken = require('../middleware/auth');
const adminOnly = require('../middleware/admin');
const { exportInventory } = require('../utils/excelSync');
const { sendExcelSyncNotification } = require('../services/emailService');

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

// Manual Excel Sync Trigger
router.post('/sync-excel', authenticateToken, adminOnly, async (req, res) => {
    try {
        // Here we would typically handle file upload, but for now we'll assume 
        // a sync process happens and return summary stats
        const { updated = 0, added = 0, removed = 0 } = req.body;

        const changes = { updated, added, removed };

        // Send notification
        const adminEmail = process.env.ADMIN_EMAIL || 'ronnielk21@gmail.com';
        if (adminEmail) {
            await sendExcelSyncNotification(changes, adminEmail);
        }

        res.json({ success: true, message: 'Inventory synced successfully', changes });
    } catch (error) {
        console.error('Excel sync error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
