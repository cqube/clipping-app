require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Article = require('../models/Article');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clipping-prensa';
const DB_FILE = path.join(__dirname, '../data/articles.json');

(async () => {
    try {
        console.log('🚀 Starting migration to MongoDB...');

        // Connect
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Read JSON
        if (!fs.existsSync(DB_FILE)) {
            console.log('⚠️ No articles.json file found. Nothing to migrate.');
            process.exit(0);
        }

        const articles = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        console.log(`📂 Found ${articles.length} articles in JSON file.`);

        let newCount = 0;
        let skippedCount = 0;

        for (const article of articles) {
            // Check existence
            const exists = await Article.findOne({ url: article.url });
            if (!exists) {
                // Ensure unique URLs if missing
                if (!article.url) {
                    article.url = `legacy-${Date.now()}-${Math.random()}`; // Fallback for bad data
                }

                // Remove legacy _id (timestamp string) to let Mongo generate a valid ObjectId
                delete article._id;

                await Article.create(article);
                newCount++;
                if (newCount % 50 === 0) process.stdout.write('.');
            } else {
                skippedCount++;
            }
        }

        console.log(`\n\n🎉 Migration Complete!`);
        console.log(`✅ Imported: ${newCount}`);
        console.log(`⏭️ Skipped (Duplicate): ${skippedCount}`);

    } catch (err) {
        console.error('❌ Migration Failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected.');
    }
})();
