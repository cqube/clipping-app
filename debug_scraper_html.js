const axios = require('axios');
const cheerio = require('cheerio');

const URL = 'https://www.adnradio.cl/?s=pesca';
const SELECTOR = 'article, .card';

(async () => {
    console.log(`Fetching ${URL}...`);
    try {
        const { data } = await axios.get(URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);
        const items = $(SELECTOR);
        console.log(`Found ${items.length} items matching '${SELECTOR}'`);

        items.each((i, el) => {
            console.log(`\n--- Item ${i + 1} ---`);
            const titleEl = $(el).find('h3 a');
            const title = titleEl.text().trim();
            const link = titleEl.attr('href');

            console.log('Title (h3 a):', title ? `"${title}"` : 'NOT FOUND');
            console.log('Link (h3 a):', link || 'NOT FOUND');

            if (!title) {
                // Check if there is an h2 instead?
                const h2Title = $(el).find('h2 a').text().trim();
                console.log('Title (h2 a):', h2Title ? `"${h2Title}"` : 'NOT FOUND');

                // Print snippet of HTML
                console.log('HTML Snippet:', $(el).html().substring(0, 300) + '...');
            }
        });

    } catch (e) {
        console.error('Error:', e.message);
    }
})();
