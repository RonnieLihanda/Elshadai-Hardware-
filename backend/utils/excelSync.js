const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const EXCEL_PATH = path.join(__dirname, '../../inventory.xlsx');

const syncSale = async (receipt_number, seller_name, items, total_amount) => {
    try {
        let workbook = new ExcelJS.Workbook();

        if (fs.existsSync(EXCEL_PATH)) {
            await workbook.xlsx.readFile(EXCEL_PATH);
        } else {
            // Create sales log sheet if file doesn't exist
            const sheet = workbook.addWorksheet('SalesLog');
            sheet.columns = [
                { header: 'Date', key: 'date', width: 20 },
                { header: 'Receipt No', key: 'receipt_number', width: 20 },
                { header: 'Seller', key: 'seller', width: 20 },
                { header: 'Items', key: 'items', width: 40 },
                { header: 'Total KES', key: 'total', width: 15 }
            ];
        }

        let sheet = workbook.getWorksheet('SalesLog');
        if (!sheet) {
            sheet = workbook.addWorksheet('SalesLog');
            sheet.columns = [
                { header: 'Date', key: 'date', width: 20 },
                { header: 'Receipt No', key: 'receipt_number', width: 20 },
                { header: 'Seller', key: 'seller', width: 20 },
                { header: 'Items', key: 'items', width: 40 },
                { header: 'Total KES', key: 'total', width: 15 }
            ];
        }

        const itemsString = items.map(i => `${i.description} (x${i.quantity})`).join(', ');

        sheet.addRow({
            date: new Date().toLocaleString(),
            receipt_number,
            seller: seller_name,
            items: itemsString,
            total: total_amount
        });

        await workbook.xlsx.writeFile(EXCEL_PATH);
        console.log(`Excel synced for receipt: ${receipt_number}`);
    } catch (error) {
        console.error('Excel Sync Error:', error.message);
    }
};

const syncInventory = async (products) => {
    try {
        let workbook = new ExcelJS.Workbook();
        if (fs.existsSync(EXCEL_PATH)) {
            await workbook.xlsx.readFile(EXCEL_PATH);
        }

        let sheet = workbook.getWorksheet('CurrentInventory');
        if (sheet) {
            workbook.removeWorksheet(sheet.id);
        }

        sheet = workbook.addWorksheet('CurrentInventory');
        sheet.columns = [
            { header: 'Item Code', key: 'item_code', width: 15 },
            { header: 'Description', key: 'description', width: 40 },
            { header: 'Quantity', key: 'quantity', width: 10 },
            { header: 'Buying Price', key: 'buying_price', width: 15 },
            { header: 'Regular Price', key: 'regular_price', width: 15 },
            { header: 'Discount Price', key: 'discount_price', width: 15 },
            { header: 'Profit/Item', key: 'profit_per_item', width: 15 }
        ];

        products.forEach(p => {
            sheet.addRow({
                item_code: p.item_code,
                description: p.description,
                quantity: p.quantity,
                buying_price: p.buying_price,
                regular_price: p.regular_price,
                discount_price: p.discount_price,
                profit_per_item: p.profit_per_item
            });
        });

        await workbook.xlsx.writeFile(EXCEL_PATH);
        console.log('Excel inventory sync complete');
    } catch (error) {
        console.error('Excel Inventory Sync Error:', error.message);
    }
};

const exportInventory = async (products) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Current Inventory');

    sheet.columns = [
        { header: 'Item Code', key: 'item_code', width: 15 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'Buying Price', key: 'buying_price', width: 15 },
        { header: 'Regular Price', key: 'regular_price', width: 15 },
        { header: 'Discount Price', key: 'discount_price', width: 15 },
        { header: 'Profit/Item', key: 'profit_per_item', width: 15 }
    ];

    products.forEach(p => {
        sheet.addRow({
            item_code: p.item_code,
            description: p.description,
            quantity: p.quantity,
            buying_price: p.buying_price,
            regular_price: p.regular_price,
            discount_price: p.discount_price,
            profit_per_item: p.profit_per_item
        });
    });

    return workbook;
};

module.exports = { syncSale, exportInventory, syncInventory };
