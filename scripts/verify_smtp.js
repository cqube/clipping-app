require('dotenv').config();
const nodemailer = require('nodemailer');

// 1. Configure Transporter (Exact copy of mailer.js logic)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || 'pescaboletin@gmail.com',
        pass: process.env.SMTP_PASS || 'Pesca2025$$'
    }
});

console.log('--- SMTP Configuration Check ---');
console.log('Host:', process.env.SMTP_HOST || 'smtp.gmail.com');
console.log('User:', process.env.SMTP_USER || 'pescaboletin@gmail.com');
console.log('Pass:', process.env.SMTP_PASS ? '****** (loaded from env)' : 'default (hardcoded)');

// 2. Verify Connection
console.log('\nVerifying SMTP connection...');
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ Error verifying connection:');
        console.error(error);
        process.exit(1);
    } else {
        console.log('✅ Server is ready to take our messages!');
        process.exit(0);
    }
});
