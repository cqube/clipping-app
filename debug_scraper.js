const { scrapeSite } = require('./services/scraper');

const site = {
    name: 'El Mercurio Beta',
    url: 'https://beta.elmercurio.com',
    selector: 'body',
    titleSelector: 'a',
    linkSelector: 'a',
    summarySelector: 'p',
    isBetaMercurio: true
};

(async () => {
    console.log('Testing full scraper logic for El Mercurio Beta...');
    const results = await scrapeSite(site);
    console.log('Results:', JSON.stringify(results, null, 2));
})();
