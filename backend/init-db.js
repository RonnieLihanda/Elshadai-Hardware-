const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'elshadai.db');
const db = new sqlite3.Database(dbPath);

const usersTable = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'seller')),
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

const productsTable = `
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_code TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  buying_price REAL NOT NULL,
  regular_price REAL NOT NULL,        -- "Selling Price (KES)-per Item" (Col F)
  discount_price REAL NOT NULL,        -- "Final selling price - Per Item" (Col G)
  discount_threshold INTEGER DEFAULT 7, -- Qty needed for discount
  profit_per_item REAL NOT NULL,
  low_stock_threshold INTEGER DEFAULT 5,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`;

const salesTable = `
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_number TEXT UNIQUE NOT NULL,
  seller_id INTEGER NOT NULL,
  total_amount REAL NOT NULL,
  total_profit REAL NOT NULL,
  items_count INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id)
);`;

const saleItemsTable = `
CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  item_code TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL,
  profit REAL NOT NULL,
  discount_applied INTEGER DEFAULT 0,
  FOREIGN KEY (sale_id) REFERENCES sales(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);`;

const receiptsTable = `
CREATE TABLE IF NOT EXISTS receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  receipt_number TEXT UNIQUE NOT NULL,
  sale_id INTEGER NOT NULL,
  receipt_data TEXT NOT NULL,  -- JSON of full receipt
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id)
);`;

db.serialize(async () => {
  // Drop tables for a fresh start with updated schema
  db.run("DROP TABLE IF EXISTS receipts");
  db.run("DROP TABLE IF EXISTS sale_items");
  db.run("DROP TABLE IF EXISTS sales");
  db.run("DROP TABLE IF EXISTS products");
  // Ensure receipts table exists
  db.run(usersTable);
  db.run(productsTable);
  db.run(salesTable);
  db.run(saleItemsTable);
  db.run(receiptsTable);

  console.log("Tables created successfully.");

  // Seed Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const sellerPassword = await bcrypt.hash('seller123', 10);

  db.run(`INSERT OR IGNORE INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)`,
    ['admin', adminPassword, 'Elshadai Admin', 'admin']);
  db.run(`INSERT OR IGNORE INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)`,
    ['seller1', sellerPassword, 'Elshadai Seller 1', 'seller']);

  console.log("Users seeded.");

  // Seed Products from Excel
  const excelJS = require('exceljs');
  const workbook = new excelJS.Workbook();
  const excelPath = path.join(__dirname, "../Elshadai's Hardware Musembe.xlsx");

  if (fs.existsSync(excelPath)) {
    try {
      await workbook.xlsx.readFile(excelPath);
      const sheet = workbook.worksheets[0];
      const products = [];

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header
          const itemCode = row.getCell(1).text;
          const description = row.getCell(2).text;
          const quantity = parseInt(row.getCell(3).value) || 0;

          // Handle values that might be formulas/objects
          const getVal = (cell) => {
            const val = cell.value;
            if (val && typeof val === 'object' && val.result !== undefined) return val.result;
            return val;
          };

          const buyingPrice = parseFloat(getVal(row.getCell(4))) || 0;
          const regularPrice = parseFloat(getVal(row.getCell(6))) || 0; // Column F
          const discountPrice = parseFloat(getVal(row.getCell(7))) || 0; // Column G
          const profitPerItem = parseFloat(getVal(row.getCell(11))) || 0; // Column K

          if (itemCode && description) {
            products.push([itemCode, description, quantity, buyingPrice, regularPrice, discountPrice, 7, profitPerItem]);
          }
        }
      });

      if (products.length > 0) {
        const stmt = db.prepare(`INSERT OR IGNORE INTO products (item_code, description, quantity, buying_price, regular_price, discount_price, discount_threshold, profit_per_item) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        products.forEach(p => stmt.run(p));
        stmt.finalize();
        console.log(`${products.length} products seeded from Excel.`);
      }
    } catch (error) {
      console.error("Error seeding from Excel:", error.message);
    }
  } else {
    console.error("Excel file not found at " + excelPath);
  }

  db.close();
});
