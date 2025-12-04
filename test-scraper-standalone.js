const { runScraper } = require('./services/scraper');
const Article = require('./models/Article');

// Mock DB
Article.findOne = async () => null;
Article.create = async (data) => {
    // console.log('  [MOCK DB] Saving:', data.title);
    return data;
};

(async () => {
    console.log('Running final scraper test...');
    try {
        const count = await runScraper();
        console.log('Test finished. Total new articles found:', count);
    } catch (err) {
        console.error('Test failed:', err);
    }
})();
