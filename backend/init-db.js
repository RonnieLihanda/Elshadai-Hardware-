const db = require('./config/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const usersTable = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'seller')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

const customersTable = `
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT,
  mpesa_purchases_count INTEGER DEFAULT 0,
  total_mpesa_spent REAL DEFAULT 0,
  total_purchases_count INTEGER DEFAULT 0,
  total_spent REAL DEFAULT 0,
  is_eligible_for_discount BOOLEAN DEFAULT FALSE,
  discount_percentage REAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_purchase_at TIMESTAMP,
  notes TEXT
);`;

const productsTable = `
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  item_code TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  buying_price REAL NOT NULL,
  regular_price REAL NOT NULL,
  discount_price REAL NOT NULL,
  discount_threshold INTEGER DEFAULT 7,
  profit_per_item REAL NOT NULL,
  low_stock_threshold INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

const salesTable = `
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,
  seller_id INTEGER NOT NULL REFERENCES users(id),
  customer_id INTEGER REFERENCES customers(id),
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK(payment_method IN ('cash', 'mpesa')),
  mpesa_reference TEXT,
  total_amount REAL NOT NULL,
  total_profit REAL NOT NULL,
  items_count INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

const customerDiscountsTable = `
CREATE TABLE IF NOT EXISTS customer_discounts (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  sale_id INTEGER NOT NULL REFERENCES sales(id),
  discount_amount REAL NOT NULL,
  discount_percentage REAL NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

const saleItemsTable = `
CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER NOT NULL REFERENCES sales(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  item_code TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL,
  profit REAL NOT NULL,
  discount_applied INTEGER DEFAULT 0
);`;

const receiptsTable = `
CREATE TABLE IF NOT EXISTS receipts (
  id SERIAL PRIMARY KEY,
  receipt_number TEXT UNIQUE NOT NULL,
  sale_id INTEGER NOT NULL REFERENCES sales(id),
  receipt_data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

const settingsTable = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

const inventoryAuditTable = `
CREATE TABLE IF NOT EXISTS inventory_audit (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    item_code TEXT NOT NULL,
    description TEXT NOT NULL,
    change_type TEXT NOT NULL,
    quantity_changed INTEGER NOT NULL,
    before_quantity INTEGER NOT NULL,
    after_quantity INTEGER NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

async function init() {
  try {
    console.log("Starting database initialization...");

    // Drops in reverse dependency order
    await db.query("DROP TABLE IF EXISTS inventory_audit");
    await db.query("DROP TABLE IF EXISTS settings");
    await db.query("DROP TABLE IF EXISTS receipts");
    await db.query("DROP TABLE IF EXISTS customer_discounts");
    await db.query("DROP TABLE IF EXISTS sale_items");
    await db.query("DROP TABLE IF EXISTS sales");
    await db.query("DROP TABLE IF EXISTS products");
    await db.query("DROP TABLE IF EXISTS customers");
    await db.query("DROP TABLE IF EXISTS users");

    // Create Tables
    await db.query(usersTable);
    await db.query(customersTable);
    await db.query(productsTable);
    await db.query(salesTable);
    await db.query(saleItemsTable);
    await db.query(customerDiscountsTable);
    await db.query(receiptsTable);
    await db.query(settingsTable);
    await db.query(inventoryAuditTable);

    console.log("✓ Tables created successfully.");

    // Seed Settings
    await db.query(`INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
      ['business_name', "Elshadai's Hardware Musembe"]);

    // Seed Users
    const adminPassword = await bcrypt.hash('admin123', 10);
    const sellerPassword = await bcrypt.hash('seller123', 10);

    await db.query(`INSERT INTO users (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING`,
      ['admin', adminPassword, 'Elshadai Admin', 'admin']);
    await db.query(`INSERT INTO users (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING`,
      ['seller1', sellerPassword, 'Elshadai Seller 1', 'seller']);

    console.log("✓ Users seeded.");

    // Seed Products from Excel
    const excelJS = require('exceljs');
    const workbook = new excelJS.Workbook();
    const excelPath = path.join(__dirname, "../Elshadai's Hardware Musembe.xlsx");

    if (fs.existsSync(excelPath)) {
      try {
        await workbook.xlsx.readFile(excelPath);
        const sheet = workbook.worksheets[0];

        for (let i = 2; i <= sheet.rowCount; i++) {
          const row = sheet.getRow(i);
          const itemCode = row.getCell(1).text;
          const description = row.getCell(2).text;
          if (!itemCode || !description) continue;

          const quantity = parseInt(row.getCell(3).value) || 0;
          const getVal = (cell) => {
            const val = cell.value;
            if (val && typeof val === 'object' && val.result !== undefined) return val.result;
            return val;
          };

          const buyingPrice = parseFloat(getVal(row.getCell(4))) || 0;
          const regularPrice = parseFloat(getVal(row.getCell(6))) || 0;
          const discountPrice = parseFloat(getVal(row.getCell(7))) || 0;
          const profitPerItem = parseFloat(getVal(row.getCell(11))) || 0;

          await db.query(
            `INSERT INTO products (item_code, description, quantity, buying_price, regular_price, discount_price, discount_threshold, profit_per_item) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (item_code) DO NOTHING`,
            [itemCode, description, quantity, buyingPrice, regularPrice, discountPrice, 7, profitPerItem]
          );
        }
        console.log("✓ Products seeded from Excel.");
      } catch (error) {
        console.error("Error seeding from Excel:", error.message);
      }
    } else {
      console.error("Excel file not found at " + excelPath);
    }

    console.log("Database initialization complete.");
  } catch (err) {
    console.error("Database initialization failed:", err);
  } finally {
    process.exit();
  }
}

init();
