const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

const BACKUP_DIR = path.join(__dirname, '../../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * @route   GET /api/admin/backup
 * @desc    Create a JSON database backup and download it
 * @access  Admin
 */
router.get('/backup', authenticateToken, isAdmin, async (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = `elshadai_data_backup_${timestamp}.json`;
        const backupPath = path.join(BACKUP_DIR, backupFile);

        // Fetch all data from main tables
        const tables = ['users', 'products', 'customers', 'sales', 'sale_items', 'settings', 'inventory_audit'];
        const backupData = {};

        for (const table of tables) {
            const { rows } = await db.query(`SELECT * FROM ${table}`);
            backupData[table] = rows;
        }

        // Save to JSON file
        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

        res.download(backupPath, backupFile, (err) => {
            if (err) {
                console.error('Backup download failed:', err);
                res.status(500).json({ error: 'Failed to download backup' });
            }
        });
    } catch (error) {
        console.error('Backup creation failed:', error);
        res.status(500).json({ error: 'Internal server error during backup' });
    }
});

/**
 * @route   POST /api/admin/restore
 * @desc    Restore database from an uploaded JSON file
 * @access  Admin
 */
router.post('/restore', authenticateToken, isAdmin, (req, res) => {
    res.status(501).json({ message: 'Restore functionality for PostgreSQL requires manual import for safety. Please use Supabase dashboard or contact support.' });
});

module.exports = router;
