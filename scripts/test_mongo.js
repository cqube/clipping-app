const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
    console.log('Testing MongoDB connection...');
    console.log('URI:', process.env.MONGODB_URI.split('@')[1]); // Log only the host part for safety
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });
        console.log('✅ Connection successful!');
        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
    }
}

testConnection();
