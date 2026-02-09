require('dotenv').config();
const { sendDailyClipping } = require('../services/mailer');
const Article = require('../models/Article');

const mongoose = require('mongoose');

async function main() {
    console.log('--- Manual Clipping Send ---');

    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clipping-prensa';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check article count first
    const articles = await Article.find().sort({ date: -1 }).limit(10); // Check recent 10
    console.log(`Found ${articles.length} total articles in DB.`);

    if (articles.length > 0) {
        console.log('Most recent article:', articles[0].title, `(${articles[0].date})`);
    }

    console.log('Invoking sendDailyClipping()...');
    // Note: sendDailyClipping might filter by date (last 24h). 
    // If no recent articles, it might skip.
    await sendDailyClipping();
}

main().catch(console.error);
