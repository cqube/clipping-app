const axios = require('axios');
const cheerio = require('cheerio');

const SITES = [
    { name: 'BioBioChile', url: 'https://www.biobiochile.cl' },
    { name: 'Cooperativa', url: 'https://www.cooperativa.cl' },
    { name: 'Diario Financiero', url: 'https://www.df.cl' },
    { name: 'Hoy x Hoy', url: 'https://www.hoyxhoy.cl' },
    { name: 'El Mercurio Valparaíso', url: 'https://www.mercuriovalpo.cl' },
    { name: 'La Región', url: 'https://www.diariolaregion.cl' } // Trying new URL
];

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

const findSearch = async () => {
    for (const site of SITES) {
        console.log(`\nInspecting ${site.name} (${site.url})...`);
        try {
            const { data } = await axios.get(site.url, { headers: HEADERS, timeout: 5000 });
            const $ = cheerio.load(data);

            // Look for forms
            $('form').each((i, el) => {
                const action = $(el).attr('action') || '';
                const method = $(el).attr('method') || 'GET';
                console.log(`  Form ${i + 1}: method=${method} action=${action}`);

                // Look for inputs
                $(el).find('input').each((j, inp) => {
                    const name = $(inp).attr('name');
                    const type = $(inp).attr('type');
                    if (name) console.log(`    Input: name=${name} type=${type}`);
                });
            });

            // Look for links containing 'buscar'
            $('a[href*="busca"]').each((i, el) => {
                console.log(`  Link: ${$(el).attr('href')}`);
            });

        } catch (error) {
            console.error(`  Error: ${error.message}`);
        }
    }
};

findSearch();
