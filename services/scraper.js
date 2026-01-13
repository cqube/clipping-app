const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const Article = require('../models/Article');
const fs = require('fs');
const path = require('path');

// --- LOAD CLIENT CONFIG ---
const CLIENT_ID = process.env.CLIENT_ID || 'pesca';
const configPath = path.join(__dirname, '../config', `${CLIENT_ID}.js`);

if (!fs.existsSync(configPath)) {
    console.error(`Config file not found for client: ${CLIENT_ID}`);
    process.exit(1);
}

const config = require(configPath);
console.log(`[Scraper] Loaded configuration for: ${config.name} (${CLIENT_ID})`);

const KEYWORDS = config.keywords;
const CATEGORIES = config.categories;
const RSS_FEEDS = config.rssFeeds;
const SITES = config.sites || [];

// Load additional keywords from ALERTS-SUBSCRIPTIONS.JSON (Optional, if still needed for legacy support)
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

// CATEGORIES loaded from config


// Shared RSS Feed URLs (Google Alerts + Others)
// To create Google Alerts: google.com/alerts -> Create alerts -> Select "RSS feed" in delivery
// RSS_FEEDS loaded from config


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

// SITES loaded from config


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
                'sernapesca.cl': 'Sernapesca',
                'diariofutrono.cl': 'Diario Futrono',
                'radiopolar.com': 'Radio Polar',
                'regionesnoticias.cl': 'Regiones Noticias',
                'portalinnova.cl': 'Portal Innova',
                'radio.uchile.cl': 'Radio Uchile',
                'australtemuco.cl': 'El Austral de la Araucanía'
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
    console.time('run-scraper');
    let totalNew = 0;

    // Trigger El Mercurio Login
    await loginToElMercurio();
    // Trigger DF Login
    await loginToDf();

    try {
        // --- OPTIMIZED SCRAPING ---
        // Create an array of promises for scraping each site
        const sitePromises = SITES
            .filter(site => !['El Mercurio Valparaíso', 'La Estrella de Iquique', 'La Estrella de Valparaíso', 'La Prensa Austral', 'Estrella Chiloé'].includes(site.name))
            .map(site => scrapeSite(site));

        // Create a promise for scraping all RSS feeds
        const rssPromise = RSS_FEEDS.length > 0 ? scrapeRssFeeds() : Promise.resolve([]);

        // Run all scraping tasks in parallel and wait for all to complete
        const results = await Promise.allSettled([...sitePromises, rssPromise]);

        // Filter out rejected promises and flatten the results
        const successfulResults = results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);

        const allResults = successfulResults.flat();

        // Log any rejected promises
        results.filter(result => result.status === 'rejected').forEach(result => {
            console.error('A scraping promise was rejected:', result.reason);
        });

        console.log(`Processing ${allResults.length} articles found from ${successfulResults.length} successful sources...`);

        // Deduplicate and Save to MongoDB
        for (const article of allResults) {
            try {
                if (!article.url) continue;
                const existing = await Article.findOne({ url: article.url });
                if (!existing) {
                    article.clientId = CLIENT_ID; // Add Client ID
                    await Article.create(article);
                    console.log(`Saved: [${article.category}] ${article.title}`);
                    totalNew++;
                }
            } catch (e) {
                console.error(`Error saving article ${article.title}:`, e.message);
            }
        }

        // Save to local file as fallback
        const dataPath = path.join(__dirname, '../data/latest_articles.json');
        if (!fs.existsSync(path.join(__dirname, '../data'))) {
            fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
        }
        // Save at most 500 articles to avoid huge file
        const toSave = allResults.slice(0, 500);
        fs.writeFileSync(dataPath, JSON.stringify(toSave, null, 4));
        console.log(`Articles also saved to ${dataPath} as fallback.`);

    } catch (error) {
        console.error('An error occurred during parallel scraping:', error);
    }

    console.timeEnd('run-scraper');
    console.log(`Scrape finished. ${totalNew} new articles saved.`);
    return totalNew;
};

module.exports = { runScraper, scrapeSite };
