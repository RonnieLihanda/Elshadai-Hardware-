const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
    service: 'gmail', // or 'outlook', 'yahoo', etc.
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify connection
transporter.verify((error, success) => {
    if (error) {
        console.error('Email configuration error (Expected if .env not updated yet):', error.message);
    } else {
        console.log('✓ Email service is ready');
    }
});

module.exports = transporter;
