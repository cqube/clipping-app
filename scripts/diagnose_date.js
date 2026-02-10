require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const Article = require('../models/Article');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

const extractDateFromUrl = (url) => {
    try {
        const dateMatch = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
        if (dateMatch) {
            return new Date(dateMatch[1], dateMatch[2] - 1, dateMatch[3]);
        }
    } catch (e) { return null; }
    return null;
};

async function diagnose(url) {
    console.log(`Diagnosing URL: ${url}`);

    // 1. Check in DB
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        await mongoose.connect(MONGODB_URI);
        const art = await Article.findOne({ url });
        if (art) {
            console.log('--- FOUND IN DB ---');
            console.log(`Title: ${art.title}`);
            console.log(`Source: ${art.source}`);
            console.log(`Stored Date: ${art.date}`);
            console.log(`Created At: ${art.createdAt}`);
        } else {
            console.log('--- NOT FOUND IN DB ---');
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error('DB Error:', err.message);
    }

    // 2. Try to scrape live
    try {
        const { data } = await axios.get(url, { headers: HEADERS });
        const $ = cheerio.load(data);

        console.log('--- LIVE METADATA ---');
        console.log('og:published_time:', $('meta[property="article:published_time"]').attr('content'));
        console.log('date:', $('meta[name="date"]').attr('content'));
        console.log('pubdate:', $('meta[name="pubdate"]').attr('content'));
        console.log('publish-date:', $('meta[name="publish-date"]').attr('content'));
        console.log('time datetime:', $('time').attr('datetime'));
        if ($('script[type="application/ld+json"]').length > 0) {
            console.log('--- JSON-LD CONTENT ---');
            $('script[type="application/ld+json"]').each((i, el) => {
                try {
                    const json = JSON.parse($(el).html());
                    console.log(`JSON-LD [${i}]:`, JSON.stringify(json, (key, value) => {
                        if (['datePublished', 'dateModified', 'publishDate', 'date'].includes(key)) return value;
                        return undefined;
                    }, 2));

                    // Also check for nested @graph
                    if (json['@graph']) {
                        json['@graph'].forEach(g => {
                            if (g.datePublished) console.log('Found in @graph.datePublished:', g.datePublished);
                            if (g.dateModified) console.log('Found in @graph.dateModified:', g.dateModified);
                        });
                    }
                } catch (e) {
                    console.log(`Failed to parse JSON-LD [${i}]`);
                }
            });
        }

        const urlDate = extractDateFromUrl(url);
        console.log('Date from URL:', urlDate);

        // Check for specific Aqua.cl patterns
        if (url.includes('aqua.cl')) {
            console.log('Checking Aqua.cl specific patterns...');
            // Aqua might have dates in the text if meta fails
            const postDateText = $('.post-meta .updated').text() || $('.entry-date').text();
            console.log('Post date text:', postDateText);
        }

    } catch (err) {
        console.error('Scrape Error:', err.message);
    }
}

const targetUrl = process.argv[2] || 'https://www.aqua.cl/multimedia/primer-congreso-sobre-gestion-de-enfermedades-bacterianas-en-acuicultura-una-mirada-interdisciplinaria/';
diagnose(targetUrl);
