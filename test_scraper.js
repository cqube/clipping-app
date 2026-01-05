require('dotenv').config();
const mongoose = require('mongoose');
const { runScraper } = require('./services/scraper');
const Article = require('./models/Article');

const uri = process.env.MONGODB_URI;

(async () => {
    try {
        await mongoose.connect(uri);
        console.log('✅ DB Connected. Running Scraper...');

        const count = await runScraper();
        console.log('✅ Scraper finished. Count:', count);

    } catch (err) {
        console.error('❌ Scraper Failed:', err);
    } finally {
        await mongoose.disconnect();
    }
})();
