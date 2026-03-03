const Parser = require('../node_modules/rss-parser');
const axios = require('axios');
const { runScraper } = require('../services/scraper');
require('dotenv').config();

async function testSourceHierarchy() {
    const parser = new Parser({
        customFields: {
            item: [
                ['source', 'source'],
            ]
        }
    });

    const url = 'https://news.google.com/rss/search?q="trabajo+para+personas+con+discapacidad"+Chile&hl=es-CL&gl=CL&ceid=CL:es-419';
    console.log(`Fetching ${url}...`);

    try {
        const feed = await parser.parseURL(url);

        for (let i = 0; i < Math.min(3, feed.items.length); i++) {
            const item = feed.items[i];
            const rssSource = item.source;
            let extractedSource = '';

            if (typeof rssSource === 'string') {
                extractedSource = rssSource;
            } else if (rssSource && rssSource.$text) {
                extractedSource = rssSource.$text;
            } else if (rssSource && rssSource.name) {
                extractedSource = rssSource.name;
            }

            const forcedSource = 'Google News - Testing';

            const source = (extractedSource && !extractedSource.includes('Google News'))
                ? extractedSource
                : (forcedSource || 'Fallback');

            console.log(`\nItem ${i + 1}:`);
            console.log(`Title: ${item.title}`);
            console.log(`Extracted from RSS <source>: "${extractedSource}"`);
            console.log(`Final Source (post-logic): "${source}"`);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testSourceHierarchy();
