const axios = require('axios');

const SITES = [
    // Sites handled via RSS or Direct
    {
        name: 'La Tercera',
        url: 'https://www.latercera.com/search/?q=pesca',
    },

    {
        name: 'El Desconcierto',
        url: 'https://www.eldesconcierto.cl/?s=pesca',
    },
    {
        name: 'Interferencia',
        url: 'https://www.interferencia.cl/?s=pesca',
    },
    // Pulso moved to RSS
    // Diario Financiero, Hoy x Hoy, SoyChile moved/checked
    {
        name: 'SoyChile',
        url: 'https://www.soychile.cl/buscador?q=pesca',
    },
    // Medios Regionales
    // El Mercurio Valparaíso moved
    {
        name: 'El Observador',
        url: 'https://www.observador.cl/?s=pesca',
    },
    // La Región moved
    {
        name: 'Pura Noticia',
        url: 'https://www.puranoticia.cl/?s=pesca',
    },
    // El Maule Informa moved
    // La Serena Online moved
    {
        name: 'Diario Talca',
        url: 'https://www.diariotalca.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    // Estrella Arica moved to RSS
    {
        name: 'Diario Antofagasta',
        url: 'https://www.diarioantofagasta.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    // El Llanquihue, La Prensa Austral, Estrella Chiloé moved
    // Especializados en Pesca y Acuicultura
    // Aqua moved
    {
        name: 'Mundo Acuícola',
        url: 'https://www.mundoacuicola.cl/new/',
        selector: '.read-title, h4',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    // PescaHoy moved
];

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

const verifySites = async () => {
    console.log('Verifying sites...');
    const results = [];

    for (const site of SITES) {
        try {
            const start = Date.now();
            const response = await axios.get(site.url, {
                headers: HEADERS,
                timeout: 10000,
                maxRedirects: 5,
                validateStatus: function (status) {
                    return status < 500; // Resolve even if 404
                }
            });
            const duration = Date.now() - start;

            results.push({
                name: site.name,
                url: site.url,
                status: response.status,
                finalUrl: response.request.res.responseUrl || site.url,
                ok: response.status >= 200 && response.status < 300,
                duration
            });
            console.log(`[${response.status}] ${site.name}: ${site.url}`);

            if (response.request.res.responseUrl && response.request.res.responseUrl !== site.url) {
                console.log(`  -> Redirected to: ${response.request.res.responseUrl}`);
            }

        } catch (error) {
            console.log(`[ERROR] ${site.name}: ${error.message}`);
            results.push({
                name: site.name,
                url: site.url,
                status: 'ERROR',
                error: error.message,
                ok: false
            });
        }
    }

    console.log('\n--- Summary ---');
    const failed = results.filter(r => !r.ok);
    console.log(`Total: ${results.length}, Failed/Redirected: ${failed.length}`);

    failed.forEach(f => {
        console.log(`- ${f.name}: ${f.status} ${f.error || ''} (${f.url})`);
    });
};

verifySites();
