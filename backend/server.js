require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const saleRoutes = require('./routes/sales');
const dashboardRoutes = require('./routes/dashboard');
const excelRoutes = require('./routes/excel');
const receiptRoutes = require('./routes/receipts');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const settingsRoutes = require('./routes/settings');
const auditRoutes = require('./routes/audit');
const adminRoutes = require('./routes/admin'); // Added for backups
const { startLowStockMonitoring } = require('./jobs/lowStockCheck');
const { sendLowStockAlert } = require('./services/emailService');
const authenticateToken = require('./middleware/auth');
const adminOnly = require('./middleware/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/excel', excelRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/admin', adminRoutes);

// Start Low Stock Monitoring
startLowStockMonitoring();

// Admin Email Trigger Endpoints
app.post('/api/admin/check-low-stock', authenticateToken, adminOnly, async (req, res) => {
    try {
        console.log('Manual low stock check triggered by:', req.user.username);
        const { checkLowStock } = require('./jobs/lowStockCheck');
        const lowStockItems = await checkLowStock();

        if (lowStockItems.length > 0) {
            const adminEmail = process.env.ADMIN_EMAIL || 'ronnielk21@gmail.com';
            const result = await sendLowStockAlert(lowStockItems, adminEmail);

            res.json({
                success: result.success,
                itemsCount: lowStockItems.length,
                emailSent: result.success,
                items: lowStockItems
            });
        } else {
            res.json({
                success: true,
                itemsCount: 0,
                message: 'All items are sufficiently stocked'
            });
        }
    } catch (error) {
        console.error('Low stock check error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/test-email', authenticateToken, adminOnly, (req, res) => {
    const transporter = require('./config/email');
    transporter.verify((error, success) => {
        if (error) {
            res.status(500).json({
                configured: false,
                error: error.message,
                message: 'Email service is not properly configured'
            });
        } else {
            res.json({
                configured: true,
                message: 'Email service is ready',
                from: process.env.EMAIL_USER
            });
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: 'Something went wrong!', error: err.message });
});

app.listen(PORT, () => {
    console.log(`Elshadai POS Backend running on port ${PORT}`);
});
