require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
    const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;

    if (!uri) {
        console.error('❌ MONGODB_URI not found in .env');
        process.exit(1);
    }

    const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
    console.log(`📡 Testing connection to: ${maskedUri}`);

    try {
        console.log('⏳ Connecting...');
        const start = Date.now();

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000,
        });

        const duration = Date.now() - start;
        console.log(`✅ Connected successfully in ${duration}ms!`);

        console.log('📋 Connection State:', mongoose.connection.readyState);
        console.log('📁 Database Name:', mongoose.connection.name);

        // Try a simple ping or findOne
        const Article = mongoose.model('Article', new mongoose.Schema({ title: String }));
        console.log('🔍 Testing query...');
        const count = await Article.countDocuments();
        console.log(`📊 Found ${count} articles.`);

        await mongoose.disconnect();
        console.log('👋 Disconnected.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Connection failed:');
        console.error(err);
        process.exit(1);
    }
}

testConnection();
