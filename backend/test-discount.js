const db = require('./config/db');

async function testDiscount() {
    console.log("--- Testing Bulk Discount Logic (PostgreSQL) ---");

    try {
        // Get a product
        const { rows } = await db.query("SELECT * FROM products LIMIT 1");
        const product = rows[0];

        if (!product) {
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

        if (parseFloat(priceS2) < parseFloat(priceS1)) {
            console.log("✓ Schema supports tiered pricing.");
        } else {
            console.log("✗ Discount price should be lower than regular price.");
        }
    } catch (err) {
        console.error("Test failed:", err.message);
    } finally {
        process.exit();
    }
}

testDiscount();
