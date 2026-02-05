require('dotenv').config();
const { generateHtml, sendEmailViaGmail } = require('../services/mailer');
const Article = require('../models/Article');
const mongoose = require('mongoose');

async function main() {
    console.log('--- Sending Test Email ---');

    const MONGODB_URI = "mongodb://cristianquevedo_db_user:1SrGCb53YWAbI9va@ac-5bpvqmy-shard-00-00.mm28t6i.mongodb.net:27017,ac-5bpvqmy-shard-00-01.mm28t6i.mongodb.net:27017,ac-5bpvqmy-shard-00-02.mm28t6i.mongodb.net:27017/?ssl=true&authSource=admin";
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get recent articles to populate the email
    const articles = await Article.find().sort({ date: -1 }).limit(15);
    console.log(`Found ${articles.length} articles for the test email.`);

    if (articles.length === 0) {
        console.log('No articles found, cannot generate email.');
        process.exit(0);
    }

    const html = generateHtml(articles);
    const subject = 'TEST: Clipping con Links Corregidos';
    const recipient = 'pescaboletin@gmail.com';

    console.log(`Sending email to ${recipient}...`);
    try {
        await sendEmailViaGmail(recipient, subject, html);
        console.log('✅ Test email sent successfully!');
    } catch (error) {
        console.error('❌ Error sending email:', error);
    }

    process.exit(0);
}

main().catch(console.error);
