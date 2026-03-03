const mongoose = require('mongoose');
const Article = require('../models/Article');
require('dotenv').config();

async function migrate() {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clipping-prensa';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB for migration.');

    const articles = await Article.find({
        $or: [
            { source: 'news.google.com' },
            { source: /^Google News/i }
        ]
    });

    console.log(`Found ${articles.length} articles to update.`);

    let updatedCount = 0;
    for (const art of articles) {
        try {
            if (art.url) {
                const urlObj = new URL(art.url);
                const domain = urlObj.hostname.replace('www.', '');
                art.source = domain;
                await art.save();
                updatedCount++;
            }
        } catch (e) {
            console.error(`Error updating article ${art._id}:`, e.message);
        }
    }

    console.log(`Migration finished. Updated ${updatedCount} articles.`);
    await mongoose.disconnect();
}

migrate().catch(console.error);
