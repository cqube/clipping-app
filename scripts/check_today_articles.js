const mongoose = require('mongoose');
require('dotenv').config();
const Article = require('../models/Article');

async function checkArticles() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            connectTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Connected to MongoDB');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const count = await Article.countDocuments({
            date: { $gte: today }
        });

        console.log(`Found ${count} articles from today (${today.toISOString()})`);

        if (count > 0) {
            const articles = await Article.find({ date: { $gte: today } }).limit(5);
            console.log('Latest 5 articles:');
            articles.forEach(a => {
                console.log(`- [${a.source}] ${a.title} (${a.date.toISOString()})`);
            });
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error:', err.message);
    }
}

checkArticles();
