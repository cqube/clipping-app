require('dotenv').config();
const { generateHtml } = require('../services/mailer');
const Article = require('../models/Article');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('--- Diagnose Email Links ---');

    const MONGODB_URI = "mongodb://cristianquevedo_db_user:1SrGCb53YWAbI9va@ac-5bpvqmy-shard-00-00.mm28t6i.mongodb.net:27017,ac-5bpvqmy-shard-00-01.mm28t6i.mongodb.net:27017,ac-5bpvqmy-shard-00-02.mm28t6i.mongodb.net:27017/?ssl=true&authSource=admin";
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get recent articles
    const articles = await Article.find().sort({ date: -1 }).limit(10);
    console.log(`Found ${articles.length} recent articles.`);

    if (articles.length === 0) {
        console.log('No articles found.');
        process.exit(0);
    }

    // Log article details relevant to linking
    console.log('\n--- Article Data ---');
    articles.forEach(a => {
        console.log(`Title: ${a.title}`);
        console.log(` Source: ${a.source}`);
        console.log(` URL: ${a.url}`);
        console.log(` Image: ${a.image}`);
        console.log('---');
    });

    // Generate HTML
    console.log('\nGenerating HTML...');
    const html = generateHtml(articles);

    const outputPath = path.join(__dirname, '../debug_email.html');
    fs.writeFileSync(outputPath, html);
    console.log(`✅ Generated HTML written to ${outputPath}`);

    // Check for links in HTML
    const linkMatches = html.match(/<a href="([^"]*)">/g);
    if (linkMatches) {
        console.log('\n--- Links found in HTML ---');
        linkMatches.forEach(l => console.log(l));
    } else {
        console.log('\n⚠️ No links found in HTML!');
    }

    process.exit(0);
}

main().catch(console.error);
