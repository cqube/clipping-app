require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Article = require('../models/Article');

const MONGODB_URI = process.env.MONGODB_URI;
const SLIDER_FILE = path.join(__dirname, '../public/slider-pesca.json');

const TARGET_URLS = [
    'https://www.mundoacuicola.cl/new/blumar-se-suma-a-camanchaca-y-anuncia-demanda-al-estado-por-ley-de-fraccionamiento/',
    'https://www.biobiochile.cl/noticias/economia/negocios-y-empresas/2026/02/05/otra-pesquera-a-tribunales-blumar-se-suma-a-camanchaca-y-demandara-al-estado-por-fraccionamiento.shtml'
];

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

async function processUrl(url) {
    console.log(`\nProcessing: ${url}`);

    try {
        // 1. Fetch Metadata
        const { data } = await axios.get(url, { headers: HEADERS });
        const $ = cheerio.load(data);

        let title = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
        let image = $('meta[property="og:image"]').attr('content');
        let summary = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';

        // Custom cleanup for titles if needed (sometimes they include site name)
        title = title.split('|')[0].trim();
        title = title.split('- BioBioChile')[0].trim();

        const source = new URL(url).hostname.replace('www.', '');
        const date = new Date(); // Current date for "most recent"
        const category = 'Pesca Artesanal'; // Both seem relevant to Pesca Artesanal based on URLs
        const clientId = 'pesca';

        if (!title) {
            console.error('❌ Could not extract title');
            return null;
        }

        console.log('  Title:', title);
        console.log('  Image:', image);

        // 2. Save to MongoDB
        const result = await Article.findOneAndUpdate(
            { url: url, clientId: clientId },
            {
                title,
                url: url,
                source,
                date,
                category,
                summary,
                image: image || '/placeholder-news.svg',
                clientId
            },
            { upsert: true, new: true }
        );
        console.log('  ✅ Article saved/updated in DB');

        return {
            title,
            url,
            image: image || 'img/fishing-banner.jpg'
        };

    } catch (e) {
        console.error(`❌ Error processing ${url}:`, e.message);
        return null;
    }
}

async function main() {
    console.log('--- Adding Manual Articles List to Pesca ---');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const newSliderItems = [];

    for (const url of TARGET_URLS) {
        const item = await processUrl(url);
        if (item) {
            newSliderItems.push({
                imageUrl: item.image,
                linkUrl: item.url,
                altText: item.title
            });
        }
    }

    // 3. Update Slider
    if (newSliderItems.length > 0 && fs.existsSync(SLIDER_FILE)) {
        let sliderData = JSON.parse(fs.readFileSync(SLIDER_FILE, 'utf8'));

        // Reverse to add them in order (first one processed goes first, but we unshift)
        // Actually we want the last processed to be first in slider?
        // Let's add them to the beginning.
        for (const newItem of newSliderItems) {
            // Check if already in slider
            const exists = sliderData.find(item => item.linkUrl === newItem.linkUrl);
            if (!exists) {
                sliderData.unshift(newItem);
                console.log(`  ✅ Added to slider: ${newItem.altText}`);
            } else {
                console.log(`  ℹ️ Already in slider: ${newItem.altText}`);
            }
        }

        // Keep at most 7 items
        const finalSlider = sliderData.slice(0, 7);

        fs.writeFileSync(SLIDER_FILE, JSON.stringify(finalSlider, null, 2));
        console.log('✅ Slider updated (public/slider-pesca.json)');
    }

    await mongoose.disconnect();
    console.log('\n--- Done ---');
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
