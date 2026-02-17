const cron = require('node-cron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { sendLowStockAlert } = require('../services/emailService');

const dbPath = path.join(__dirname, '../elshadai.db');
const db = new sqlite3.Database(dbPath);

// Check for low stock items
const checkLowStock = async () => {
    return new Promise((resolve, reject) => {
        const query = `
      SELECT 
        id,
        item_code,
        description,
        quantity,
        low_stock_threshold,
        regular_price,
        buying_price
      FROM products 
      WHERE quantity <= low_stock_threshold
      ORDER BY 
        CASE 
          WHEN quantity = 0 THEN 1
          WHEN quantity <= 2 THEN 2
          ELSE 3
        END,
        quantity ASC
    `;

        db.all(query, [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

// Schedule daily low stock check
const startLowStockMonitoring = () => {
    console.log('📧 Starting low stock monitoring service...');

    // Run every day at 8:00 AM EAT
    cron.schedule('0 8 * * *', async () => {
        console.log('🔍 Running scheduled low stock check (8:00 AM EAT)...');

        try {
            const lowStockItems = await checkLowStock();

            if (lowStockItems.length > 0) {
                console.log(`Found ${lowStockItems.length} low stock items`);

                const adminEmail = process.env.ADMIN_EMAIL;

                if (!adminEmail) {
                    console.error('⚠️ ADMIN_EMAIL not configured in environment variables');
                    return;
                }

                const result = await sendLowStockAlert(lowStockItems, adminEmail);

                if (result.success) {
                    console.log(`✓ Low stock alert sent to ${adminEmail}`);

                    // Log notification in database if audit_log exists
                    db.run(
                        "INSERT INTO audit_log (user_id, action, details) SELECT NULL, ?, ? WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='audit_log')",
                        ['low_stock_email_sent', JSON.stringify({ items_count: lowStockItems.length, email: adminEmail })]
                    );
                } else {
                    console.error('✗ Failed to send low stock alert:', result.error);
                }
            } else {
                console.log('✓ All items are sufficiently stocked');
            }

        } catch (error) {
            console.error('Error in low stock check:', error);
        }
    }, {
        timezone: "Africa/Nairobi"
    });

    console.log('✓ Low stock monitoring scheduled for 8:00 AM daily (EAT)');
};

module.exports = {
    startLowStockMonitoring,
    checkLowStock
};
