const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

async function diagnose(url) {
    console.log(`Diagnosing URL: ${url}`);

    try {
        const { data } = await axios.get(url, { headers: HEADERS });
        const $ = cheerio.load(data);

        console.log('--- LIVE METADATA ---');
        console.log('og:published_time:', $('meta[property="article:published_time"]').attr('content'));
        console.log('date:', $('meta[name="date"]').attr('content'));

        if ($('script[type="application/ld+json"]').length > 0) {
            console.log('--- JSON-LD CONTENT ---');
            $('script[type="application/ld+json"]').each((i, el) => {
                try {
                    const json = JSON.parse($(el).html());
                    // Look for datePublished in the main object or in @graph
                    if (json.datePublished) console.log(`JSON-LD [${i}] datePublished:`, json.datePublished);
                    if (json['@graph']) {
                        json['@graph'].forEach(g => {
                            if (g.datePublished) console.log(`@graph datePublished:`, g.datePublished);
                        });
                    }
                } catch (e) { }
            });
        }

    } catch (err) {
        console.error('Scrape Error:', err.message);
    }
}

const targetUrl = process.argv[2] || 'https://www.aqua.cl/multimedia/primer-congreso-sobre-gestion-de-enfermedades-bacterianas-en-acuicultura-una-mirada-interdisciplinaria/';
diagnose(targetUrl);
