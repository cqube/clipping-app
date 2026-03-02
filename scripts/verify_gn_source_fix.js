const { scrapeSite } = require('../services/scraper');
const path = require('path');
const fs = require('fs');

// We need to mock some things because scraper.js expects a lot of environment and config
// But we just want to test scrapeRssFeeds. 
// Since scrapeRssFeeds is not exported, we'll test by running a mini version of it here 
// or by temporarily exporting it.

const Parser = require('rss-parser');
const parser = new Parser({
    customFields: {
        item: [
            ['source', 'source'],
        ]
    }
});

async function verify() {
    const url = 'https://news.google.com/rss/search?q=pesca&hl=es-CL&gl=CL&ceid=CL:es-419';
    console.log(`Verifying source extraction from: ${url}...`);

    try {
        const feed = await parser.parseURL(url);
        console.log(`Feed: ${feed.title}`);

        let successCount = 0;
        let sampleSources = [];

        for (let i = 0; i < Math.min(feed.items.length, 10); i++) {
            const item = feed.items[i];
            const source = item.source;
            if (source) {
                successCount++;
                sampleSources.push(source);
            }
        }

        console.log(`Successfully extracted source from ${successCount}/${Math.min(feed.items.length, 10)} items.`);
        console.log('Sample sources found:', sampleSources.join(', '));

        if (successCount > 0) {
            console.log('\n✅ VERIFICATION SUCCESSFUL: Source names are being extracted.');
        } else {
            console.log('\n❌ VERIFICATION FAILED: No source names found.');
            process.exit(1);
        }
    } catch (error) {
        console.error('Error during verification:', error.message);
        process.exit(1);
    }
}

verify();
