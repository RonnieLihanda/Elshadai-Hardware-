const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const authenticateToken = require('../middleware/auth');
const isAdmin = require('../middleware/admin');

// Path to the database file
const DB_PATH = path.join(__dirname, '../../elshadai.db');
const BACKUP_DIR = path.join(__dirname, '../../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * @route   GET /api/admin/backup
 * @desc    Create a database backup and download it
 * @access  Admin
 */
router.get('/backup', authenticateToken, isAdmin, (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = `elshadai_backup_${timestamp}.db`;
        const backupPath = path.join(BACKUP_DIR, backupFile);

        // Copy the database file
        fs.copyFileSync(DB_PATH, backupPath);

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
 * @desc    Restore database from an uploaded file
 * @access  Admin
 */
router.post('/restore', authenticateToken, isAdmin, (req, res) => {
    // Note: In a real production environment, this would involve file upload (e.g., multer)
    // and potentially a server restart. For this local POS, we'll provide the logic 
    // but advise caution as it overwrites current data.
    res.status(501).json({ message: 'Restore functionality requires manual database replacement for safety. Please contact support.' });
});

module.exports = router;
