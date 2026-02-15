const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function verifySaleFix() {
    console.log("--- STARTING FINAL SALE VERIFICATION ---");

    try {
        // 1. Login to get token
        console.log("Logging in as seller1...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'seller1',
            password: 'seller123'
        });
        const token = loginRes.data.token;
        console.log("Login successful. Token obtained.");

        // 2. Clear current database state of any existing testing data if needed (optional)
        // For now we just perform a sale for a known item.

        // 3. Get a product to sell
        console.log("Fetching products...");
        const productsRes = await axios.get(`${API_URL}/products`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const product = productsRes.data[0];
        console.log(`Using product for test: ${product.description} (Stock: ${product.quantity})`);

        // 4. Perform a sale
        console.log("Attempting sale...");
        const saleData = {
            items: [
                {
                    product_id: product.id,
                    item_code: product.item_code,
                    description: product.description,
                    quantity: 2,
                    buying_price: product.buying_price,
                    regular_price: product.regular_price,
                    discount_price: product.discount_price,
                    unit_price: product.regular_price,
                    total_price: product.regular_price * 2,
                    profit: (product.regular_price - product.buying_price) * 2
                }
            ],
            total_amount: product.regular_price * 2,
            total_profit: (product.regular_price - product.buying_price) * 2
        };

        const saleRes = await axios.post(`${API_URL}/sales`, saleData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("SALE RESPONSE:", saleRes.data);
        console.log("✓ SALE COMPLETED SUCCESSFULLY!");

        // 5. Verify stock reduction
        console.log("Verifying stock update...");
        const updatedProductsRes = await axios.get(`${API_URL}/products`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const updatedProduct = updatedProductsRes.data.find(p => p.id === product.id);
        console.log(`Original Stock: ${product.quantity}, Updated Stock: ${updatedProduct.quantity}`);

        if (updatedProduct.quantity === product.quantity - 2) {
            console.log("✓ STOCK UPDATED CORRECTLY!");
        } else {
            console.log("✗ STOCK UPDATE FAILED!");
        }

    } catch (error) {
        console.error("✗ VERIFICATION FAILED!");
        if (error.response) {
            console.error("Data:", error.response.data);
            console.error("Status:", error.response.status);
        } else {
            console.error("Error Message:", error.message);
        }
    }
}

verifySaleFix();
