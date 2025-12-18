const axios = require('axios');

const SITES = [
    {
        name: 'BioBioChile',
        url: 'https://www.biobiochile.cl/buscador?q=pesca',
    },
    {
        name: 'La Tercera',
        url: 'https://www.latercera.com/search/?q=pesca',
    },
    // Medios Nacionales
    {
        name: 'El Mercurio',
        url: 'https://www.elmercurio.com/inversiones/noticias/busqueda.aspx?q=pesca',
    },
    {
        name: 'Cooperativa',
        url: 'https://www.cooperativa.cl/noticias/site/tax/port/all/taxport_10___1.html',
    },
    {
        name: 'ADN Radio',
        url: 'https://www.adnradio.cl/search/pesca/',
    },
    {
        name: 'El Desconcierto',
        url: 'https://www.eldesconcierto.cl/?s=pesca',
    },
    {
        name: 'Interferencia',
        url: 'https://www.interferencia.cl/?s=pesca',
    },
    {
        name: 'Pulso',
        url: 'https://www.pulso.cl/buscador/?query=pesca',
    },
    {
        name: 'Diario Financiero',
        url: 'https://www.df.cl/buscar?q=pesca',
    },
    {
        name: 'Hoy x Hoy',
        url: 'https://www.hoyxhoy.cl/search/pesca/',
    },
    {
        name: 'SoyChile',
        url: 'https://www.soychile.cl/buscador?q=pesca',
    },
    // Medios Regionales
    {
        name: 'El Mercurio Valparaíso',
        url: 'https://www.mercuriovalpo.cl/search/?query=pesca',
    },
    {
        name: 'El Observador',
        url: 'https://www.observador.cl/?s=pesca',
    },
    {
        name: 'La Región',
        url: 'https://www.laregion.cl/?s=pesca',
    },
    {
        name: 'Pura Noticia',
        url: 'https://www.puranoticia.cl/?s=pesca',
    },
    {
        name: 'El Maule Informa',
        url: 'https://www.elmauleinforma.cl/?s=pesca',
    },
    {
        name: 'Hora 12',
        url: 'https://www.hora12.cl/?s=pesca',
    },
    {
        name: 'La Serena Online',
        url: 'https://www.laserenaonline.cl/?s=pesca',
    },
    {
        name: 'Diario Talca',
        url: 'https://www.diariotalca.cl/?s=pesca',
    },
    {
        name: 'Estrella Arica',
        url: 'https://www.estrellaarica.cl/?s=pesca',
    },
    {
        name: 'Diario Antofagasta',
        url: 'https://www.diarioantofagasta.cl/?s=pesca',
    },
    {
        name: 'El Llanquihue',
        url: 'https://www.elllanquihue.cl/?s=pesca',
    },
    {
        name: 'La Prensa Austral',
        url: 'https://www.laprensaaustral.cl/?s=pesca',
    },
    {
        name: 'Estrella Chiloé',
        url: 'https://www.estrellachiloe.cl/?s=pesca',
    },
    // Especializados en Pesca y Acuicultura
    {
        name: 'Aqua',
        url: 'https://www.aqua.cl/',
    },
    {
        name: 'Mundo Acuícola',
        url: 'https://www.mundoacuicola.cl/new/',
    },
    {
        name: 'PescaHoy',
        url: 'https://www.pescahoy.cl/',
    }
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
