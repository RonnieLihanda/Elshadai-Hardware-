const cron = require('node-cron');
const db = require('../config/db');
const { sendLowStockAlert } = require('../services/emailService');

// Check for low stock items
const checkLowStock = async () => {
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

    const { rows } = await db.query(query);
    return rows;
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

                    // Log notification in database - updated for PostgreSQL
                    try {
                        await db.query(
                            "INSERT INTO inventory_audit (product_id, item_code, description, change_type, quantity_changed, before_quantity, after_quantity, user_id, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
                            [0, 'SYSTEM', 'Low Stock Alert', 'NOTIFICATION', 0, 0, 0, 1, `Email sent to ${adminEmail}`]
                        );
                    } catch (auditErr) {
                        console.error('Failed to log low stock notification to audit:', auditErr.message);
                    }
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
