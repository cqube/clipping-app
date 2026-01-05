const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const Article = require('../models/Article');
const fs = require('fs');
const path = require('path');

let KEYWORDS = ['pesca', 'pescador', 'salmonicultura', 'acuicultura', 'marítimo', 'sernapesca', 'subpesca'];

// Load additional keywords from ALERTS-SUBSCRIPTIONS.JSON
const qs = require('querystring');

let EL_MERCURIO_TOKEN = null;

const loginToElMercurio = async () => {
    try {
        console.log('Logging in to El Mercurio...');
        const loginUrl = 'https://digital.elmercurio.com/Authenticate';
        const payload = qs.stringify({
            login: 'mtrivelli@factorestrategico.cl',
            password: 'factor',
            action: 'appToken'
        });

        const { data } = await axios.post(loginUrl, payload, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        if (data && data.length === 64) {
            EL_MERCURIO_TOKEN = data;
            console.log('  El Mercurio Login Successful via API. Token length: ' + data.length);
            return true;
        } else {
            console.error('  El Mercurio Login Failed. Response:', data);
            return false;
        }
    } catch (error) {
        console.error('  Error logging in to El Mercurio:', error.message);
        return false;
    }
};

const loginToDf = async () => {
    if (!process.env.DF_USER || !process.env.DF_PASS) return false;

    try {
        console.log('Logging in to Diario Financiero...');
        // Placeholder for actual login
        // const loginUrl = 'https://www.df.cl/api/auth/login'; 
        // const { data } = await axios.post(loginUrl, ...);
        console.log('  DF Login credentials loaded. Waiting for endpoint verification.');
        return true;

    } catch (error) {
        console.error('  Error logging in to DF:', error.message);
        return false;
    }
};


try {
    const alertsPath = path.join(__dirname, 'ALERTS-SUBSCRIPTIONS.JSON');
    if (fs.existsSync(alertsPath)) {
        const alertsData = JSON.parse(fs.readFileSync(alertsPath, 'utf8'));
        if (alertsData.subscriptions && Array.isArray(alertsData.subscriptions)) {
            const alertQueries = alertsData.subscriptions
                .map(sub => sub.query)
                .filter(query => query && typeof query === 'string');

            // Add unique queries to KEYWORDS
            alertQueries.forEach(query => {
                const lowerQuery = query.toLowerCase();
                if (!KEYWORDS.includes(lowerQuery)) {
                    KEYWORDS.push(lowerQuery);
                }
            });
            console.log(`Loaded ${alertQueries.length} additional keywords from ALERTS-SUBSCRIPTIONS.JSON`);
        }
    }
} catch (error) {
    console.error('Error loading ALERTS-SUBSCRIPTIONS.JSON:', error.message);
}

const CATEGORIES = {
    'Pesca Artesanal': ['artesanal', 'conapach', 'confepach', 'caleta', 'pescador artesanal'],
    'Cultivos y Áreas de Manejo': ['área de manejo', 'amerb', 'cultivo', 'alga', 'mitilicultura'],
    'Ley de Pesca': ['ley de pesca', 'fraccionamiento', 'parlamento', 'congreso', 'legislación', 'diputados', 'senado', 'comisión de pesca'],
    'Sector Pesquero': ['sector pesquero', 'subpesca', 'sernapesca', 'consejo nacional de pesca', 'fpa', 'indespa', 'institucionalidad'],
    'Pais y Sector Empresarial': ['empresarial', 'economía', 'exportación', 'mercado', 'industria', 'gremio'],
    'Pesca Industrial': ['industrial', 'sonapesca', 'asipes', 'pesca industrial', 'camanchaca', 'blumar'],
    'Salmoneras': ['salmón', 'salmonera', 'salmonicultura', 'salmonero', 'australis', 'aqua'],
    'Innovación Acuícola': ['innovación', 'tecnología', 'investigación', 'desarrollo', 'ciencia']
};

// Shared RSS Feed URLs (Google Alerts + Others)
// To create Google Alerts: google.com/alerts -> Create alerts -> Select "RSS feed" in delivery
const RSS_FEEDS = [
    'https://www.diarioeldia.cl/rss/noticias',
    'https://www.google.com/alerts/feeds/08397670603095634428/18119852156385057077',
    'https://www.google.com/alerts/feeds/08397670603095634428/10231861125372209595',
    'https://www.google.com/alerts/feeds/08397670603095634428/10693748374007497326',
    'https://www.google.com/alerts/feeds/08397670603095634428/330466514247678387',
    'https://www.google.com/alerts/feeds/08397670603095634428/16468006218765930623',
    'https://www.google.com/alerts/feeds/08397670603095634428/2590044238413771770',
    'https://www.google.com/alerts/feeds/08397670603095634428/18339820440676763392',
    'https://www.google.com/alerts/feeds/08397670603095634428/10693748374007497711',
    'https://www.google.com/alerts/feeds/08397670603095634428/16468006218765934227',
    'https://www.google.com/alerts/feeds/08397670603095634428/10693748374007498663',
    'https://www.google.com/alerts/feeds/08397670603095634428/10693748374007498275',
    // Nuevos Medios RSS (Directos)
    'https://www.ciperchile.cl/feed/',
    'https://www.theclinic.cl/feed/',
    'https://www.elciudadano.com/feed/',

    // Nuevos Medios via Google News RSS (para sitios difíciles de scrapear o sin feed directo)
    { url: 'https://news.google.com/rss/search?q=site:emol.com+pesca&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'Emol' },
    { url: 'https://news.google.com/rss/search?q=site:meganoticias.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'Meganoticias' },
    { url: 'https://news.google.com/rss/search?q=site:24horas.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: '24 Horas' },
    { url: 'https://news.google.com/rss/search?q=site:t13.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'T13' },
    { url: 'https://news.google.com/rss/search?q=site:chvnoticias.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'CHV Noticias' },
    { url: 'https://news.google.com/rss/search?q=site:cnnchile.com+pesca&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'CNN Chile' },
    { url: 'https://news.google.com/rss/search?q=site:elmostrador.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'El Mostrador' },
    { url: 'https://news.google.com/rss/search?q=site:eldinamo.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'El Dínamo' },
    { url: 'https://news.google.com/rss/search?q=site:pauta.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'Pauta' },
    { url: 'https://news.google.com/rss/search?q=site:ellibero.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419', sourceName: 'El Líbero' },
    {
        "url": "https://news.google.com/rss/search?q=site:lacuarta.com+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "La Cuarta"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:Lun.com+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Las Últimas Noticias"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:elconquistadorfm.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio El Conquistador"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:portalesvalparaiso.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Portales"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:pudahuel.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Pudahuel"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:arica365.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Arica365"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:aricatv.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Arica TV"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:antofagastatv.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Antofagasta TV"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:araucaniadiario.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Araucanía Diario"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:cronicachillan.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Crónica Chillán"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:curicoalbirrojo.com+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Curicó Albirrojo"
    },
    // Migrated from direct scraping due to broken links/search
    {
        "url": "https://news.google.com/rss/search?q=site:biobiochile.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "BioBioChile"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:cooperativa.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Cooperativa"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:adnradio.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "ADN Radio"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:df.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Diario Financiero"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:hoyxhoy.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Hoy x Hoy"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:mercuriovalpo.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "El Mercurio Valparaíso"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:diariolaregion.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "La Región"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:elmauleinforma.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "El Maule Informa"
    },
    // Second batch of migrations (timeouts/errors)
    {
        "url": "https://news.google.com/rss/search?q=site:laserenaonline.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "La Serena Online"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:elllanquihue.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "El Llanquihue"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:laprensaaustral.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "La Prensa Austral"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:estrellachiloe.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Estrella Chiloé"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:aqua.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Aqua"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:pescahoy.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "PescaHoy"
    },
    // Migrating problematic redirects
    {
        "url": "https://news.google.com/rss/search?q=site:pulso.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Pulso"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:estrellaarica.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Estrella Arica"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:diarioatacama.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Diario Atacama"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:australvaldivia.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Diario Austral de Los Ríos"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:diariochañarcillo.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Diario Chañarcillo"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:diarioconcepcion.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Diario Concepción"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:diarioaysen.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Diario de Aysén"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:diariodeosorno.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Diario de Osorno"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:diariocentro.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Diario El Centro"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:ellongino.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Diario El Longino"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:elovallino.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Diario El Ovallino"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:australtemuco.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "El Austral de Temuco"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:Coquimbo+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "El Día"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:Aysén+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "El Divisadero"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:mercurioantofagasta.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "El Mercurio de Antofagasta"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:elmercuriodepuertomontt.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "El Mercurio de Puerto Montt"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:Arica+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "El Morrocotudo.cl"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:elrancaguino.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "El Rancagüino"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:O'Higgins+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "El Tipógrafo"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:Antofagasta+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "FM Plus"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:itvpatagonia.com+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "ITV Patagonia"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:iquiquetv.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Iquique TV"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:Ñuble+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "La Discusión"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:estrellaIquique.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "La Estrella de Iquique"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:estrellavalpo.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "La Estrella de Valparaíso"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:Atacama+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Maray Radio"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:mauleopina.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Maule Opina"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:nubledigital.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Ñuble Digital"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:elpinguino.com+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Pingüino Multimedia/El Pingüino"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:Valparaíso+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Puranoticia.cl"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:Biobío+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Punto Siete"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radioaraucana.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Araucana"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiobienvenida.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Bienvenida (O'Higgins)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:carnaval.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Carnaval"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiocaramelo.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Caramelo (O'Higgins)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiochillan.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Chillán"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiochiloe.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Chiloé"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:digitalfmarica.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Digital FM Arica"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:digitalfmvaldivia.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Digital FM Valdivia"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiofemenina.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Femenina (Biobío)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiofestival.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Festival (Valparaíso)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiofestiva.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Festiva (Atacama)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiofutura.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Futura (Maule)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiogen.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Gen (Aysén)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:grado90.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Grado 90 (Tarapacá)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:guayacanfm.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Guayacán FM (Coquimbo)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:ilusionfm.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Ilusión FM (O'Higgins)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiointeractiva.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Interactiva (Ñuble)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radioladiscusion.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio La Discusión (Ñuble)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiomagallanes.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Magallanes"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiomadero.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Madero (Antofagasta)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiomia.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Mía (Maule)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiomirador.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Mirador (Araucanía)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:montecarlo.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Montecarlo (Coquimbo)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radionatales.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Natales (Magallanes)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radioneura.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Neura Arica"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:nostalgia.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Nostalgia Iquique"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radionuble.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Ñuble"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiopaloma.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Paloma (Maule)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiopaulina.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Paulina (Arica)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiopilmaiquen.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Pilmaiquén (Los Ríos)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiopinguino.com+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Pingüino (Magallanes)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiopuertanorte.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Puerta Norte (Arica)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radioreloncavi.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Reloncaví (Los Lagos)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radionuevotiempo.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio RT (Atacama)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiorumbos.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Rumbos (O'Higgins)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:sago.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Sago Osorno (Los Lagos)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiosantamaria.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Santa María (Aysén)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiosol.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Sol FM (Antofagasta)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiouniversal.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Universal Temuco"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radiovalparaiso.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Valparaíso"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:radioventisqueros.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Radio Ventisqueros (Aysén)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:resumen.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Resumen.cl (Biobío)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:rioenlinea.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Río en Línea (Los Ríos)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:rtllinares.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "RTL Linares (Maule)"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:temucodiario.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Temuco Diario"
    },
    {
        "url": "https://news.google.com/rss/search?q=site:timeline.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        "sourceName": "Timeline.cl (Antofagasta)"
    },
    {
        url: "https://news.google.com/rss/search?q=site:cooperativa.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        sourceName: "Cooperativa"
    },
    {
        url: "https://news.google.com/rss/search?q=site:df.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        sourceName: "Diario Financiero"
    },
    {
        url: "https://news.google.com/rss/search?q=site:hoyxhoy.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        sourceName: "Hoy x Hoy"
    },
    {
        url: "https://news.google.com/rss/search?q=site:mercuriovalpo.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        sourceName: "El Mercurio Valparaíso"
    },
    {
        url: "https://news.google.com/rss/search?q=site:diariolaregion.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        sourceName: "La Región"
    },
    {
        url: "https://news.google.com/rss/search?q=site:elmercurio.com+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        sourceName: "El Mercurio"
    },
    {
        url: "https://news.google.com/rss/search?q=site:digital.elmercurio.com+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        sourceName: "El Mercurio (Digital)"
    },
    {
        url: "https://news.google.com/rss/search?q=site:elmercurio.com/Inversiones/+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        sourceName: "El Mercurio Inversiones"
    },
    {
        url: "https://news.google.com/rss/search?q=site:soychile.cl+pesca&hl=es-CL&gl=CL&ceid=CL:es-419",
        sourceName: "SoyChile"
    }
];

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
};

const DEFAULT_IMAGE = '/placeholder-news.svg';

// Fetch article metadata (image and date) from the actual page
const fetchArticleMetadata = async (url) => {
    try {
        const headers = { ...HEADERS };
        if (EL_MERCURIO_TOKEN && (url.includes('elmercurio.com') || url.includes('lasegunda.com'))) {
            headers['Cookie'] = `appToken=${EL_MERCURIO_TOKEN}`;
        }

        const { data } = await axios.get(url, {
            headers: headers,
            timeout: 5000
        });
        const $ = cheerio.load(data);

        // --- IMAGE EXTRACTION ---
        // Try to find og:image first (most reliable)
        let image = $('meta[property="og:image"]').attr('content');

        // Fallback to twitter:image
        if (!image) {
            image = $('meta[name="twitter:image"]').attr('content');
        }

        // Fallback to first article image
        if (!image) {
            image = $('article img').first().attr('src') ||
                $('.article-content img').first().attr('src') ||
                $('main img').first().attr('src');
        }

        // Make sure URL is absolute
        if (image && !image.startsWith('http')) {
            try {
                image = new URL(image, url).toString();
            } catch (e) {
                image = null;
            }
        }

        // --- DATE EXTRACTION ---
        let date = null;

        // Try standard meta tags
        const dateMeta = $('meta[property="article:published_time"]').attr('content') ||
            $('meta[name="date"]').attr('content') ||
            $('meta[name="pubdate"]').attr('content') ||
            $('meta[name="publish-date"]').attr('content') ||
            $('time').attr('datetime');

        if (dateMeta) {
            date = new Date(dateMeta);
        }

        // If invalid date, reset to null
        if (date && isNaN(date.getTime())) {
            date = null;
        }

        return {
            image: image || null,
            date: date || null
        };
    } catch (error) {
        console.log(`  Could not fetch metadata from ${url}`);
        return { image: null, date: null };
    }
};

const SITES = [
    // BioBioChile, Cooperativa, ADN Radio moved to RSS
    {
        name: 'La Tercera',
        url: 'https://www.latercera.com/search/?q=pesca',
        selector: 'article, .card, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: '.deck, p'
    },
    {
        name: 'El Desconcierto',
        url: 'https://eldesconcierto.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p, .excerpt'
    },
    {
        name: 'Interferencia',
        url: 'https://interferencia.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    // Medios Regionales
    {
        name: 'El Observador',
        url: 'https://www.observador.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    {
        name: 'Pura Noticia',
        url: 'https://puranoticia.pnt.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    // El Maule Informa, Hora 12 moved to RSS (Hora 12 failed too, migrating for safety)
    // Actually Hora 12 was OK [200], keeping it.
    {
        name: 'Hora 12',
        url: 'https://www.hora12.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
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
    {
        name: 'El Mercurio Beta',
        url: 'https://beta.elmercurio.com', // Base URL, will be handled specifically
        selector: 'body', // Dummy selector, handled in specialized logic
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p',
        isBetaMercurio: true
    }
];

// Helper to check if text contains keywords
const containsKeyword = (text) => {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return KEYWORDS.some(keyword => lowerText.includes(keyword));
};

// Helper to classify article
const classifyArticle = (text) => {
    if (!text) return 'Otros';
    const lowerText = text.toLowerCase();

    for (const [category, terms] of Object.entries(CATEGORIES)) {
        if (terms.some(term => lowerText.includes(term))) {
            return category;
        }
    }
    return 'Otros';
};

const scrapeSite = async (site) => {
    console.log(`Scraping ${site.name}...`);
    try {
        const { data } = await axios.get(site.url, { headers: HEADERS });
        const $ = cheerio.load(data);
        const articles = [];
        const seenUrls = new Set();
        const candidates = [];

        if (site.name === 'BioBioChile') {
            // Collect candidates first (no await in .each)
            $('a').each((i, el) => {
                const title = $(el).text().trim();
                const link = $(el).attr('href');

                if (title && link && link.includes('/noticias/') && title.length > 20) {
                    const fullUrl = link.startsWith('http') ? link : new URL(link, 'https://www.biobiochile.cl').toString();

                    if (!seenUrls.has(fullUrl) && containsKeyword(title)) {
                        seenUrls.add(fullUrl);
                        candidates.push({
                            title,
                            url: fullUrl,
                            source: site.name,
                            summary: '',
                            date: new Date(),
                            category: classifyArticle(title)
                        });
                    }
                }
            });
        } else {
            // Generic logic for La Tercera and others
            $(site.selector).each((i, el) => {
                const titleEl = $(el).find(site.titleSelector).first();
                const title = titleEl.text().trim(); // Removed dangerous fallback to $(el).text()
                const link = $(el).find(site.linkSelector).attr('href') || $(el).attr('href');
                const summary = $(el).find(site.summarySelector).text().trim();

                if (title && link && title.length > 10) {
                    let fullUrl = link;
                    try {
                        if (!link.startsWith('http')) {
                            const baseUrl = new URL(site.url).origin;
                            fullUrl = new URL(link, baseUrl).toString();
                        }
                    } catch (e) {
                        console.error(`Error constructing URL for ${link} on ${site.name}:`, e.message);
                        return;
                    }

                    if (!seenUrls.has(fullUrl)) {
                        if (containsKeyword(title) || containsKeyword(summary)) {
                            seenUrls.add(fullUrl);
                            candidates.push({
                                title,
                                url: fullUrl,
                                source: site.name,
                                summary,
                                date: new Date(),
                                category: classifyArticle(title + ' ' + summary)
                            });
                        }
                    }
                }
            });
        }

        // Now fetch metadata for each candidate (with await)
        for (const candidate of candidates) {
            const metadata = await fetchArticleMetadata(candidate.url);
            articles.push({
                ...candidate,
                image: metadata.image || DEFAULT_IMAGE,
                date: metadata.date || candidate.date // Use extracted date or fallback to scrape date
            });
        }

        console.log(`  Found ${articles.length} candidates on ${site.name}`);
        return articles;
    } catch (error) {
        console.error(`Error scraping ${site.name}:`, error.message);
        return [];
    }
};

// Scrape RSS feeds (Google Alerts and others)
const scrapeRssFeeds = async () => {
    const parser = new Parser();
    const articles = [];

    // Helper to extract source name from URL
    const extractSourceFromUrl = (url) => {
        try {
            const hostname = new URL(url).hostname;
            // Remove www. prefix and get domain name
            let domain = hostname.replace(/^www\./, '');

            // Map common domains to readable names
            const domainMap = {
                'biobiochile.cl': 'BioBioChile',
                'latercera.com': 'La Tercera',
                'diarioeldia.cl': 'Diario El Día',
                'elmercurio.com': 'El Mercurio',
                'cooperativa.cl': 'Cooperativa',
                'adnradio.cl': 'ADN Radio',
                'emol.com': 'Emol',
                '24horas.cl': '24 Horas',
                'cnnchile.com': 'CNN Chile',
                't13.cl': 'T13',
                'chvnoticias.cl': 'CHV Noticias',
                'meganoticias.cl': 'Mega Noticias',
                'aqua.cl': 'Aqua',
                'mundoacuicola.cl': 'Mundo Acuícola',
                'pescahoy.cl': 'PescaHoy',
                'df.cl': 'Diario Financiero',
                'pulso.cl': 'Pulso',
                'eldesconcierto.cl': 'El Desconcierto',
                'interferencia.cl': 'Interferencia',
                'elllanquihue.cl': 'El Llanquihue',
                'laprensaaustral.cl': 'La Prensa Austral',
                'estrellachiloe.cl': 'Estrella Chiloé',
                'soychile.cl': 'SoyChile',
                'mercuriovalpo.cl': 'El Mercurio Valparaíso',
                'diarioantofagasta.cl': 'Diario Antofagasta',
                'estrellaarica.cl': 'Estrella Arica',
                'laregion.cl': 'La Región',
                'puranoticia.cl': 'Pura Noticia',
                'hoyxhoy.cl': 'Hoy x Hoy',
                'observador.cl': 'El Observador',
                'elmauleinforma.cl': 'El Maule Informa',
                'diariotalca.cl': 'Diario Talca',
                'laserenaonline.cl': 'La Serena Online',
                'hora12.cl': 'Hora 12',
                'eldinamo.cl': 'El Dínamo',
                'publimetro.cl': 'Publimetro',
                'lun.com': 'LUN',
                'lasegunda.com': 'La Segunda',
                'economia.cl': 'Economía',
                'subpesca.cl': 'Subpesca',
                'sernapesca.cl': 'Sernapesca'
            };

            // Check if domain is in map
            if (domainMap[domain]) {
                return domainMap[domain];
            }

            // Otherwise, format domain nicely (capitalize first letter, remove .cl/.com)
            domain = domain.replace(/\.(cl|com|net|org)$/, '');
            return domain.charAt(0).toUpperCase() + domain.slice(1);
        } catch (e) {
            return 'Google Alerts';
        }
    };

    for (const feedEntry of RSS_FEEDS) {
        const feedUrl = typeof feedEntry === 'string' ? feedEntry : feedEntry.url;
        const forcedSource = typeof feedEntry === 'object' ? feedEntry.sourceName : null;

        try {
            console.log(`Fetching RSS feed: ${feedUrl}...`);
            const feed = await parser.parseURL(feedUrl);

            for (const item of feed.items) {
                const title = item.title || '';
                let url = item.link || '';

                // Unwrap Google Alert redirects to get the real source URL
                // Example: https://www.google.com/url?url=https://www.pescahoy.cl/...
                try {
                    const u = new URL(url);
                    if (u.hostname.includes('google.com') && u.pathname === '/url') {
                        const realUrl = u.searchParams.get('url') || u.searchParams.get('q');
                        if (realUrl) {
                            url = realUrl;
                        }
                    }
                    // Handle Google News RSS articles URLs that redirect to actual source
                    // Example: https://news.google.com/rss/articles/CBMi...
                    else if (u.hostname.includes('news.google.com') && u.pathname.includes('/rss/articles/')) {
                        try {
                            // Follow redirect to get actual article URL
                            const response = await axios.get(url, {
                                maxRedirects: 5,
                                timeout: 5000,
                                headers: HEADERS
                            });
                            // axios follows redirects automatically, so response.request.res.responseUrl has final URL
                            // But that's not always available, so we check the final URL from the response
                            if (response.request && response.request.res && response.request.res.responseUrl) {
                                url = response.request.res.responseUrl;
                            }
                        } catch (error) {
                            // If redirect fails, try to extract from error response
                            if (error.response && error.response.request && error.response.request.res && error.response.request.res.responseUrl) {
                                url = error.response.request.res.responseUrl;
                            }
                            // Otherwise keep original URL, extractSourceFromUrl will handle it
                        }
                    }
                } catch (e) {
                    // unexpected url format, keep original
                }

                const summary = item.contentSnippet || item.content || '';
                const date = item.pubDate ? new Date(item.pubDate) : new Date();

                // Only add if contains fishing-related keywords
                if (containsKeyword(title) || containsKeyword(summary)) {
                    // Extract source from URL
                    const source = forcedSource || extractSourceFromUrl(url);

                    // Fetch metadata (image + date)
                    const metadata = await fetchArticleMetadata(url);

                    articles.push({
                        title,
                        url,
                        source,
                        summary: summary.substring(0, 300), // Limit summary length
                        date: metadata.date || date, // Use extracted date or RSS date
                        category: classifyArticle(title + ' ' + summary),
                        image: metadata.image || DEFAULT_IMAGE
                    });
                }
            }

            console.log(`  Found ${feed.items.length} items in RSS feed`);
        } catch (error) {
            console.error(`Error fetching RSS feed ${feedUrl}:`, error.message);
        }
    }

    return articles;
};

const runScraper = async () => {
    console.log('Starting daily scrape...');
    let totalNew = 0;
    const allResults = [];

    // Trigger El Mercurio Login
    await loginToElMercurio();
    // Trigger DF Login
    await loginToDf();

    // Scrape traditional news sites
    for (const site of SITES) {
        if (['El Mercurio Valparaíso', 'La Estrella de Iquique', 'La Estrella de Valparaíso', 'La Prensa Austral', 'Estrella Chiloé'].includes(site.name)) {
            continue;
        }
        try {
            const scrapedArticles = await scrapeSite(site);
            allResults.push(...scrapedArticles);
        } catch (e) {
            console.error(`Error scraping ${site.name}:`, e.message);
        }
    }

    // Scrape RSS feeds
    if (RSS_FEEDS.length > 0) {
        try {
            const feedArticles = await scrapeRssFeeds();
            allResults.push(...feedArticles);
        } catch (e) {
            console.error('Error scraping RSS feeds:', e.message);
        }
    }

    console.log(`Processing ${allResults.length} articles found...`);

    // Deduplicate and Save to MongoDB
    for (const article of allResults) {
        try {
            // Check existence in DB by URL
            // Ensure URL is present
            if (!article.url) continue;

            const existing = await Article.findOne({ url: article.url });
            if (!existing) {
                await Article.create(article);
                console.log(`Saved: [${article.category}] ${article.title}`);
                totalNew++;
            }
        } catch (e) {
            console.error(`Error saving article ${article.title}:`, e.message);
        }
    }

    console.log(`Scrape finished. ${totalNew} new articles saved.`);
    return totalNew;
};

module.exports = { runScraper, scrapeSite };
