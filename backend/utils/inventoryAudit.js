const db = require('../config/db');

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
async function logInventoryChange(productId, itemCode, description, type, changeQty, beforeQty, afterQty, userId, notes = '') {
    const sql = `
        INSERT INTO inventory_audit 
        (product_id, item_code, description, change_type, quantity_changed, before_quantity, after_quantity, user_id, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    try {
        await db.query(sql, [productId, itemCode, description, type, changeQty, beforeQty, afterQty, userId, notes]);
    } catch (err) {
        console.error('FAILED TO LOG INVENTORY AUDIT:', err.message);
    }
}

module.exports = { logInventoryChange };
