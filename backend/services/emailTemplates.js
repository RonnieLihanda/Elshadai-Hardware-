const generateLowStockEmail = (lowStockItems, totalLowStock) => {
    const itemRows = lowStockItems.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.item_code}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; ${item.quantity === 0 ? 'color: #dc2626; font-weight: 700;' : item.quantity <= 2 ? 'color: #f59e0b; font-weight: 600;' : 'color: #ea580c;'}">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.low_stock_threshold}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
        ${item.quantity === 0 ? '<span style="background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">OUT OF STOCK</span>' :
            item.quantity <= 2 ? '<span style="background: #f59e0b; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">CRITICAL</span>' :
                '<span style="background: #ea580c; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">LOW</span>'}
      </td>
    </tr>
  `).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 800px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a5f3f 0%, #0f3d28 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🏗️ Elshadai Hardware</h1>
          <p style="color: #f0fdf4; margin: 10px 0 0 0; font-size: 14px;">Musembe, Eldoret, Kenya</p>
        </div>

        <!-- Alert Banner -->
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px;">
          <h2 style="color: #991b1b; margin: 0 0 10px 0; font-size: 20px;">⚠️ Low Stock Alert</h2>
          <p style="color: #7f1d1d; margin: 0; font-size: 16px;">
            <strong>${totalLowStock}</strong> item${totalLowStock > 1 ? 's' : ''} ${totalLowStock > 1 ? 'are' : 'is'} running low on stock and need${totalLowStock > 1 ? '' : 's'} immediate attention.
          </p>
        </div>

        <!-- Items Table -->
        <div style="padding: 20px;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0;">Items Requiring Restock:</h3>
          
          <table style="width: 100%; border-collapse: collapse; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #374151; font-weight: 600;">Item Code</th>
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #374151; font-weight: 600;">Description</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #374151; font-weight: 600;">Current Stock</th>
                <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #374151; font-weight: 600;">Min. Required</th>
                <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #374151; font-weight: 600;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
        </div>

        <!-- Summary Stats -->
        <div style="padding: 20px; background: #f9fafb; margin: 20px; border-radius: 8px;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0;">Summary:</h3>
          <div style="display: flex; justify-content: space-around; gap: 15px;">
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #dc2626;">
                ${lowStockItems.filter(i => i.quantity === 0).length}
              </div>
              <div style="font-size: 12px; color: #6b7280;">Out of Stock</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">
                ${lowStockItems.filter(i => i.quantity > 0 && i.quantity <= 2).length}
              </div>
              <div style="font-size: 12px; color: #6b7280;">Critical (≤2)</div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 24px; font-weight: 700; color: #ea580c;">
                ${lowStockItems.filter(i => i.quantity > 2 && i.quantity <= i.low_stock_threshold).length}
              </div>
              <div style="font-size: 12px; color: #6b7280;">Low Stock</div>
            </div>
          </div>
        </div>

        <!-- Action Items -->
        <div style="padding: 20px; margin: 20px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
          <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 16px;">📋 Action Required:</h3>
          <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Review the items listed above</li>
            <li style="margin-bottom: 8px;">Place orders with suppliers for out-of-stock items</li>
            <li style="margin-bottom: 8px;">Update inventory in the POS system once restocked</li>
            <li style="margin-bottom: 8px;">Or update the Excel file and re-upload to sync</li>
          </ul>
        </div>

        <!-- Footer -->
        <div style="padding: 20px; text-align: center; background: #f9fafb; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 5px 0;">
            This is an automated notification from Elshadai Hardware POS System
          </p>
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            Report generated: ${new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
            You're receiving this because you're the admin of Elshadai Hardware POS
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

    const text = `
LOW STOCK ALERT - Elshadai Hardware
====================================

${totalLowStock} item(s) are running low on stock:

${lowStockItems.map(item => `
${item.item_code} - ${item.description}
Current Stock: ${item.quantity} (Min: ${item.low_stock_threshold})
Status: ${item.quantity === 0 ? 'OUT OF STOCK' : item.quantity <= 2 ? 'CRITICAL' : 'LOW STOCK'}
`).join('\n')}

ACTION REQUIRED:
- Review items listed above
- Place orders with suppliers
- Update inventory after restocking

Generated: ${new Date().toLocaleString()}
  `;

    return { html, text };
};

const generateExcelSyncNotification = (changes) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #10b981; margin-top: 0;">✅ Excel File Synced Successfully</h2>
        <p style="color: #374151;">The inventory has been updated from the Excel file.</p>
        
        <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0;">
          <strong style="display: block; margin-bottom: 10px; color: #065f46;">Changes Summary:</strong>
          <ul style="margin: 0; padding-left: 20px; color: #065f46;">
            <li>Products updated: <strong>${changes.updated || 0}</strong></li>
            <li>New products added: <strong>${changes.added || 0}</strong></li>
            <li>Products removed: <strong>${changes.removed || 0}</strong></li>
          </ul>
        </div>
        
        <p style="color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
          Synced at: ${new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}
        </p>
      </div>
    </body>
    </html>
  `;

    const text = `Excel File Synced Successfully\n\nProducts updated: ${changes.updated || 0}\nNew products added: ${changes.added || 0}\nProducts removed: ${changes.removed || 0}`;

    return { html, text };
};

module.exports = {
    generateLowStockEmail,
    generateExcelSyncNotification
};
