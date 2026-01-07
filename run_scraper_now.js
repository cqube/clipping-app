require('dotenv').config();
const { runScraper } = require('./services/scraper');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clipping-prensa';

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('🔄 Ejecutando scraper manualmente...\n');
        await runScraper();
        console.log('\n✅ Scraping completado');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Error:', err);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit(1);
    }
}

run();
