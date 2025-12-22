const { scrapeSite } = require('./services/scraper');

const site = {
    name: 'ADN Radio',
    url: 'https://www.adnradio.cl/?s=pesca',
    selector: 'article, .card',
    titleSelector: 'h3 a',
    linkSelector: 'h3 a',
    summarySelector: 'p.ent, p'
};

(async () => {
    console.log('Testing full scraper logic for ADN Radio...');
    const results = await scrapeSite(site);
    console.log('Results:', JSON.stringify(results, null, 2));
})();
