const API_URL = 'http://localhost:5000/api';

const api = {
    async login(username, password) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }
        return response.json();
    },

    async getMe(token) {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch user');
        return response.json();
    },

    async searchProducts(query, token) {
        const response = await fetch(`${API_URL}/products/search?q=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Search failed');
        return response.json();
    },

    async getAllProducts(token, page = 1, limit = 50, lowStock = false) {
        const response = await fetch(`${API_URL}/products?page=${page}&limit=${limit}&lowStock=${lowStock}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch products');
        return response.json();
    },

    async createSale(saleData, token) {
        const response = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(saleData),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Sale failed');
        }
        return response.json();
    },

    async getDashboardStats(token, period = 'today') {
        const response = await fetch(`${API_URL}/dashboard/stats?period=${period}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch stats');
        return response.json();
    },

    async getSalesHistory(token, startDate, endDate, seller_id) {
        let url = `${API_URL}/sales?startDate=${startDate}&endDate=${endDate}`;
        if (seller_id) url += `&seller_id=${seller_id}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch sales history');
        return response.json();
    },

    async updateProduct(id, productData, token) {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData),
        });
        if (!response.ok) throw new Error('Failed to update product');
        return response.json();
    },

    async createProduct(productData, token) {
        const response = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productData),
        });
        if (!response.ok) throw new Error('Failed to add product');
        return response.json();
    },

    async deleteProduct(id, token) {
        const response = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete product');
        }
        return response.json();
    },

    async checkProductSales(id, token) {
        const response = await fetch(`${API_URL}/products/${id}/has-sales`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to check sales history');
        return response.json();
    },

    async getUsers(token) {
        const response = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
    },

    async updateUserPassword(token, userId, newPassword) {
        const response = await fetch(`${API_URL}/users/${userId}/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ new_password: newPassword }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Update failed');
        }
        return response.json();
    },

    async getReceipt(token, receiptNumber) {
        const response = await fetch(`${API_URL}/receipts/${receiptNumber}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch receipt');
        return response.json();
    },

    async exportInventory(token) {
        const response = await fetch(`${API_URL}/excel/export`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Export failed');
        return response.blob();
    }
};

export default api;
