const transporter = require('../config/email');
const { generateLowStockEmail, generateExcelSyncNotification } = require('./emailTemplates');

const sendLowStockAlert = async (lowStockItems, recipientEmail) => {
    try {
        console.log(`Preparing to send low stock alert to: ${recipientEmail}`);

        if (!lowStockItems || lowStockItems.length === 0) {
            console.log('No low stock items to report');
            return { success: true, message: 'No low stock items' };
        }

        const { html, text } = generateLowStockEmail(lowStockItems, lowStockItems.length);

        const mailOptions = {
            from: {
                name: 'Elshadai Hardware POS',
                address: process.env.EMAIL_USER
            },
            to: recipientEmail,
            subject: `⚠️ LOW STOCK ALERT - ${lowStockItems.length} Items Need Restocking`,
            html: html,
            text: text,
            priority: 'high'
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✓ Low stock alert email sent:', info.messageId);

        return {
            success: true,
            messageId: info.messageId,
            itemsCount: lowStockItems.length
        };

    } catch (error) {
        console.error('Failed to send low stock alert:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

const sendExcelSyncNotification = async (changes, recipientEmail) => {
    try {
        const { html, text } = generateExcelSyncNotification(changes);

        const mailOptions = {
            from: {
                name: 'Elshadai Hardware POS',
                address: process.env.EMAIL_USER
            },
            to: recipientEmail,
            subject: '✅ Inventory Synced from Excel',
            html: html,
            text: text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✓ Excel sync notification sent:', info.messageId);

        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('Failed to send Excel sync notification:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendLowStockAlert,
    sendExcelSyncNotification
};
