require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const Article = require('../models/Article');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

async function fetchCorrectDate(url) {
    try {
        const { data } = await axios.get(url, { headers: HEADERS, timeout: 5000 });
        const $ = cheerio.load(data);
        let date = null;

        // JSON-LD
        $('script[type="application/ld+json"]').each((i, el) => {
            if (date) return;
            try {
                const json = JSON.parse($(el).html());
                const findDate = (obj) => {
                    if (!obj || typeof obj !== 'object') return null;
                    if (obj.datePublished) return obj.datePublished;
                    if (obj.dateModified) return obj.dateModified;
                    if (obj['@graph'] && Array.isArray(obj['@graph'])) {
                        for (const g of obj['@graph']) {
                            const d = findDate(g);
                            if (d) return d;
                        }
                    }
                    return null;
                };
                const ldDate = findDate(json);
                if (ldDate) {
                    const parsed = new Date(ldDate);
                    if (!isNaN(parsed.getTime())) date = parsed;
                }
            } catch (e) { }
        });

        // Meta tags
        if (!date) {
            const dateMeta = $('meta[property="article:published_time"]').attr('content') ||
                $('meta[property="og:published_time"]').attr('content') ||
                $('meta[name="date"]').attr('content') ||
                $('time[datetime]').attr('datetime');
            if (dateMeta) {
                const parsed = new Date(dateMeta);
                if (!isNaN(parsed.getTime())) date = parsed;
            }
        }

        return date;
    } catch (e) {
        return null;
    }
}

async function fixDates() {
    try {
        const MONGODB_URI = process.env.MONGODB_URI;
        const isSrvConnection = MONGODB_URI.startsWith('mongodb+srv://');
        let directConnectionUri = null;

        if (isSrvConnection) {
            const match = MONGODB_URI.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)(\/.*)?(\?.*)?$/);
            if (match) {
                const [, username, password, cluster, dbPath, queryParams] = match;
                directConnectionUri = `mongodb://${username}:${password}@ac-5bpvqmy-shard-00-00.mm28t6i.mongodb.net:27017,ac-5bpvqmy-shard-00-01.mm28t6i.mongodb.net:27017,ac-5bpvqmy-shard-00-02.mm28t6i.mongodb.net:27017${dbPath || '/test'}?replicaSet=atlas-wgzqsf-shard-0&ssl=true&authSource=admin`;
            }
        }

        try {
            console.log('Connecting to MongoDB via SRV...');
            await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        } catch (srvError) {
            if (directConnectionUri) {
                console.log('SRV failed, trying direct connection...');
                await mongoose.connect(directConnectionUri);
            } else {
                throw srvError;
            }
        }

        console.log('Connected to MongoDB');

        // Look for articles created in the last 48 hours that might have wrong dates
        // Or specific domains like aqua.cl
        const articles = await Article.find({
            $or: [
                { createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) } },
                { url: /aqua\.cl/ }
            ]
        });

        console.log(`Checking ${articles.length} articles...`);
        let fixedCount = 0;

        for (const art of articles) {
            const correctDate = await fetchCorrectDate(art.url);

            if (correctDate && correctDate.toISOString() !== art.date.toISOString()) {
                console.log(`Fixing date for: ${art.title}`);
                console.log(`  Old: ${art.date.toISOString()}`);
                console.log(`  New: ${correctDate.toISOString()}`);

                art.date = correctDate;
                await art.save();
                fixedCount++;
            }
        }

        console.log(`Finished. Fixed ${fixedCount} articles.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixDates();
