const mongoose = require('mongoose');
const Article = require('./models/Article');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const CLIENT_ID = 'test-client';

async function testBulkSave() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        const testArticles = [
            { title: 'Bulk Test 1', url: 'https://example.com/bulk1', date: new Date(), source: 'Test', category: 'Otros', clientId: CLIENT_ID },
            { title: 'Bulk Test 2', url: 'https://example.com/bulk2', date: new Date(), source: 'Test', category: 'Otros', clientId: CLIENT_ID },
            { title: 'Bulk Test 1 (Dup)', url: 'https://example.com/bulk1', date: new Date(), source: 'Test', category: 'Otros', clientId: CLIENT_ID }
        ];

        console.log(`Preparing bulk save for ${testArticles.length} candidates...`);

        const bulkOps = testArticles
            .filter(article => article.url)
            .map(article => ({
                updateOne: {
                    filter: { url: article.url, clientId: CLIENT_ID },
                    update: { $setOnInsert: { ...article, clientId: CLIENT_ID } },
                    upsert: true
                }
            }));

        const result = await Article.bulkWrite(bulkOps, { ordered: false });
        console.log('✅ Bulk save finished.');
        console.log('Upserted:', result.upsertedCount);
        console.log('Matched:', result.matchedCount);

        // Cleanup
        await Article.deleteMany({ clientId: CLIENT_ID });
        console.log('Cleanup finished.');
        process.exit(0);

    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
}

testBulkSave();
