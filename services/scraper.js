const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const Article = require('../models/Article');

const KEYWORDS = ['pesca', 'pescador', 'salmonicultura', 'acuicultura', 'marítimo', 'sernapesca', 'subpesca'];

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

// Google Alerts RSS Feed URLs
// To create: google.com/alerts -> Create alerts -> Select "RSS feed" in delivery
const GOOGLE_ALERTS_FEEDS = [
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
    'https://www.google.com/alerts/feeds/08397670603095634428/10693748374007498275'
];

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
};

const DEFAULT_IMAGE = '/placeholder-news.svg';

// Fetch article image from the actual page
const fetchArticleImage = async (url) => {
    try {
        const { data } = await axios.get(url, {
            headers: HEADERS,
            timeout: 5000
        });
        const $ = cheerio.load(data);

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

        return image || null;
    } catch (error) {
        console.log(`  Could not fetch image from ${url}`);
        return null;
    }
};

const SITES = [
    {
        name: 'BioBioChile',
        url: 'https://www.biobiochile.cl/buscador?q=pesca',
        selector: 'body',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p',
        isSearch: true
    },
    {
        name: 'La Tercera',
        url: 'https://www.latercera.com/etiqueta/pesca/',
        selector: 'article, .card, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: '.deck, p'
    },
    // Medios Nacionales
    {
        name: 'El Mercurio',
        url: 'https://www.elmercurio.com/inversiones/noticias/busqueda.aspx?q=pesca',
        selector: 'article, .news-item, .article-item, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p, .summary'
    },
    {
        name: 'Cooperativa',
        url: 'https://www.cooperativa.cl/noticias/site/tax/port/all/taxport_10___1.html',
        selector: 'article, .news-item, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    {
        name: 'ADN Radio',
        url: 'https://www.adnradio.cl/search/pesca/',
        selector: 'article, .card, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    {
        name: 'El Desconcierto',
        url: 'https://www.eldesconcierto.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p, .excerpt'
    },
    {
        name: 'Interferencia',
        url: 'https://www.interferencia.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    {
        name: 'Pulso',
        url: 'https://www.pulso.cl/buscador/?query=pesca',
        selector: 'article, .card, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    {
        name: 'Diario Financiero',
        url: 'https://www.df.cl/buscar?q=pesca',
        selector: 'article, .card, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    {
        name: 'Hoy x Hoy',
        url: 'https://www.hoyxhoy.cl/search/pesca/',
        selector: 'article, .card, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    {
        name: 'SoyChile',
        url: 'https://www.soychile.cl/buscador?q=pesca',
        selector: 'article, .card, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    // Medios Regionales
    {
        name: 'El Mercurio Valparaíso',
        url: 'https://www.mercuriovalpo.cl/search/?query=pesca',
        selector: 'article, .news-item, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    {
        name: 'El Observador',
        url: 'https://www.observador.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    {
        name: 'La Región',
        url: 'https://www.laregion.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    {
        name: 'Pura Noticia',
        url: 'https://www.puranoticia.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    {
        name: 'El Maule Informa',
        url: 'https://www.elmauleinforma.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    {
        name: 'Hora 12',
        url: 'https://www.hora12.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    {
        name: 'La Serena Online',
        url: 'https://www.laserenaonline.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    {
        name: 'Diario Talca',
        url: 'https://www.diariotalca.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    {
        name: 'Estrella Arica',
        url: 'https://www.estrellaarica.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    {
        name: 'Diario Antofagasta',
        url: 'https://www.diarioantofagasta.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    {
        name: 'El Llanquihue',
        url: 'https://www.elllanquihue.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    {
        name: 'La Prensa Austral',
        url: 'https://www.laprensaaustral.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    {
        name: 'Estrella Chiloé',
        url: 'https://www.estrellachiloe.cl/?s=pesca',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    // Especializados en Pesca y Acuicultura
    {
        name: 'Aqua',
        url: 'https://www.aqua.cl/category/noticias/',
        selector: 'article, .post, .entry, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p, .excerpt'
    },
    {
        name: 'Mundo Acuícola',
        url: 'https://www.mundoacuicola.cl/category/noticias/',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
    },
    {
        name: 'PescaHoy',
        url: 'https://www.pescahoy.cl/',
        selector: 'article, .post, h2, h3',
        titleSelector: 'a',
        linkSelector: 'a',
        summarySelector: 'p'
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
                const title = titleEl.text().trim() || $(el).text().trim();
                const link = $(el).find(site.linkSelector).attr('href') || $(el).attr('href');
                const summary = $(el).find(site.summarySelector).text().trim();

                if (title && link && title.length > 10) {
                    const fullUrl = link.startsWith('http') ? link : new URL(link, 'https://www.latercera.com').toString();

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

        // Now fetch images for each candidate (with await)
        for (const candidate of candidates) {
            const image = await fetchArticleImage(candidate.url);
            articles.push({
                ...candidate,
                image: image || DEFAULT_IMAGE
            });
        }

        console.log(`  Found ${articles.length} candidates on ${site.name}`);
        return articles;
    } catch (error) {
        console.error(`Error scraping ${site.name}:`, error.message);
        return [];
    }
};

// Scrape Google Alerts RSS feeds
const scrapeGoogleAlerts = async () => {
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

    for (const feedUrl of GOOGLE_ALERTS_FEEDS) {
        try {
            console.log(`Fetching Google Alert feed...`);
            const feed = await parser.parseURL(feedUrl);

            for (const item of feed.items) {
                const title = item.title || '';
                const url = item.link || '';
                const summary = item.contentSnippet || item.content || '';
                const date = item.pubDate ? new Date(item.pubDate) : new Date();

                // Only add if contains fishing-related keywords
                if (containsKeyword(title) || containsKeyword(summary)) {
                    // Extract source from URL
                    const source = extractSourceFromUrl(url);

                    articles.push({
                        title,
                        url,
                        source,
                        summary: summary.substring(0, 300), // Limit summary length
                        date,
                        category: classifyArticle(title + ' ' + summary)
                    });
                }
            }

            console.log(`  Found ${feed.items.length} items in Google Alert feed`);
        } catch (error) {
            console.error(`Error fetching Google Alert feed:`, error.message);
        }
    }

    return articles;
};

const runScraper = async () => {
    console.log('Starting daily scrape...');
    let totalNew = 0;

    // Scrape traditional news sites
    for (const site of SITES) {
        const scrapedArticles = await scrapeSite(site);

        for (const articleData of scrapedArticles) {
            try {
                const exists = await Article.findOne({ url: articleData.url });
                if (!exists) {
                    await Article.create(articleData);
                    totalNew++;
                    console.log(`Saved: [${articleData.category}] ${articleData.title}`);
                }
            } catch (err) {
                // console.error('Error saving article:', err.message);
            }
        }
    }

    // Scrape Google Alerts feeds
    if (GOOGLE_ALERTS_FEEDS.length > 0) {
        const alertArticles = await scrapeGoogleAlerts();

        for (const articleData of alertArticles) {
            try {
                const exists = await Article.findOne({ url: articleData.url });
                if (!exists) {
                    await Article.create(articleData);
                    totalNew++;
                    console.log(`Saved (Alert): [${articleData.category}] ${articleData.title}`);
                }
            } catch (err) {
                // console.error('Error saving article:', err.message);
            }
        }
    }

    console.log(`Scrape finished. ${totalNew} new articles found.`);
    return totalNew;
};

module.exports = { runScraper };
