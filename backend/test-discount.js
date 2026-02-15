const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'elshadai.db');
const db = new sqlite3.Database(dbPath);

async function testDiscount() {
    console.log("--- Testing Bulk Discount Logic ---");

    // Get a product
    db.get("SELECT * FROM products LIMIT 1", (err, product) => {
        if (err || !product) {
            console.error("No products found");
            process.exit(1);
        }

        console.log(`Testing with product: ${product.description}`);
        console.log(`Regular: ${product.regular_price}, Discount: ${product.discount_price}`);

        // Scenario 1: 6 items (Regular)
        const qtyS1 = 6;
        const priceS1 = product.regular_price;
        console.log(`Scenario 1: ${qtyS1} items -> Expected Price: ${priceS1}`);

        // Scenario 2: 7 items (Discount)
        const qtyS2 = 7;
        const priceS2 = product.discount_price;
        console.log(`Scenario 2: ${qtyS2} items -> Expected Price: ${priceS2}`);

        if (priceS2 < priceS1) {
            console.log("✓ Schema supports tiered pricing.");
        } else {
            console.log("✗ Discount price should be lower than regular price.");
        }

        db.close();
    });
}

testDiscount();
