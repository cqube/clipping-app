const axios = require('axios');
const cheerio = require('cheerio');

const url = 'https://www.df.cl/regiones/biobio/empresas/resurge-polemica-por-ley-de-fraccionamiento-pesquero-industriales-y';

(async () => {
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        const image = $('meta[property="og:image"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content');
        const title = $('meta[property="og:title"]').attr('content') || $('title').text();
        const description = $('meta[property="og:description"]').attr('content');

        console.log('Image URL:', image);
        console.log('Title:', title);
        console.log('Description:', description);
    } catch (e) {
        console.error('Error:', e.message);
    }
})();
