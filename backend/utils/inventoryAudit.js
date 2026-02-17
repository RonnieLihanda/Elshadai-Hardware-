const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../elshadai.db');

/**
 * Logs a change in inventory
 * @param {number} productId 
 * @param {string} itemCode 
 * @param {string} description 
 * @param {string} type - 'SALE', 'RESTOCK', 'EDIT', 'EXCEL_SYNC', 'DELETE'
 * @param {number} changeQty 
 * @param {number} beforeQty 
 * @param {number} afterQty 
 * @param {number} userId 
 * @param {string} notes 
 */
function logInventoryChange(productId, itemCode, description, type, changeQty, beforeQty, afterQty, userId, notes = '') {
    const db = new sqlite3.Database(dbPath);
    const sql = `
        INSERT INTO inventory_audit 
        (product_id, item_code, description, change_type, quantity_changed, before_quantity, after_quantity, user_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [productId, itemCode, description, type, changeQty, beforeQty, afterQty, userId, notes], (err) => {
        if (err) console.error('FAILED TO LOG INVENTORY AUDIT:', err.message);
        db.close();
    });
}

module.exports = { logInventoryChange };
