require('dotenv').config();
const Article = require('../models/Article');
const mongoose = require('mongoose');

async function main() {
    console.log('--- Check Problematic Articles ---');

    const MONGODB_URI = "mongodb://cristianquevedo_db_user:1SrGCb53YWAbI9va@ac-5bpvqmy-shard-00-00.mm28t6i.mongodb.net:27017,ac-5bpvqmy-shard-00-01.mm28t6i.mongodb.net:27017,ac-5bpvqmy-shard-00-02.mm28t6i.mongodb.net:27017/?ssl=true&authSource=admin";
    await mongoose.connect(MONGODB_URI);

    // 1. Articles with missing or short URLs
    const badUrls = await Article.find({
        $or: [
            { url: { $exists: false } },
            { url: '' },
            { url: '#' },
            { url: null }
        ]
    }).limit(10);

    console.log(`\nFound ${badUrls.length} articles with empty/bad URLs.`);
    badUrls.forEach(a => console.log(`- [${a._id}] ${a.title} (URL: "${a.url}")`));

    // 2. El Mercurio / La Segunda articles
    console.log('\n--- El Mercurio / La Segunda ---');
    const restricted = await Article.find({
        source: { $in: ['El Mercurio', 'La Segunda'] }
    }).sort({ date: -1 }).limit(5);

    restricted.forEach(a => {
        console.log(`Title: ${a.title}`);
        console.log(`URL: ${a.url}`);
        console.log(`Image: ${a.image}`);
        console.log('---');
    });

    process.exit(0);
}

main().catch(console.error);
