require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('./models/Article');

async function checkSources() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clipping');

    // Find articles with "news.google.com" or similar in source
    const googleSources = await Article.find({
        source: { $regex: /google|news\.google/i }
    }).limit(10);

    console.log('\n=== Articles with Google-related sources ===');
    googleSources.forEach(art => {
        console.log(`Source: "${art.source}" | URL: ${art.url.substring(0, 80)}...`);
    });

    // Find recent articles to check source variety
    const recentArticles = await Article.find()
        .sort({ date: -1 })
        .limit(20);

    console.log('\n=== Recent 20 articles and their sources ===');
    recentArticles.forEach(art => {
        console.log(`Source: "${art.source}" | Title: ${art.title.substring(0, 60)}...`);
    });

    await mongoose.disconnect();
}

checkSources().catch(console.error);
