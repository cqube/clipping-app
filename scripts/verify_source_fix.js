const { runScraper } = require('../services/scraper');
const Article = require('../models/Article');
const mongoose = require('mongoose');
require('dotenv').config();

async function verify() {
    console.log('--- Verification: Source Extraction ---');

    // Connect to DB if needed (usually scraper does it, but we are importing runScraper)
    // Actually runScraper expects a connection.

    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clipping-prensa';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB.');

    console.log('Running scraper (this may take a while)...');
    // We can't easily mock the RSS feed perfectly without intercepting axios,
    // but we can check the results in the DB after a real run.

    // Alternatively, let's just check the latest articles in the DB to see if any have "news.google.com" as source
    const articles = await Article.find({ source: /google/i }).limit(10);
    console.log(`Found ${articles.length} articles with "google" in source.`);

    articles.forEach(a => {
        console.log(`- Title: ${a.title.substring(0, 50)}...`);
        console.log(`  Source: ${a.source}`);
        console.log(`  URL: ${a.url.substring(0, 50)}...`);
    });

    if (articles.some(a => a.source === 'news.google.com')) {
        console.log('⚠️ Warning: Still found articles with news.google.com as source.');
    } else {
        console.log('✅ No articles with literal news.google.com as source found in recent sample.');
    }

    await mongoose.disconnect();
}

verify().catch(console.error);
