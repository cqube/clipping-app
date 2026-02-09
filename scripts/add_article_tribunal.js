require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Article = require('../models/Article');

const MONGODB_URI = process.env.MONGODB_URI;
const SLIDER_FILE = path.join(__dirname, '../public/slider-pesca.json');
const TARGET_URL = 'https://www.latercera.com/politica/noticia/quienes-son-los-subsecretarios-de-kast/';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

async function main() {
    console.log('--- Adding Manual Article to Pesca ---');

    let title, image, summary;

    // 1. Fetch Metadata
    try {
        console.log(`Fetching metadata for: ${TARGET_URL}`);
        const { data } = await axios.get(TARGET_URL, { headers: HEADERS });
        const $ = cheerio.load(data);

        title = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
        image = $('meta[property="og:image"]').attr('content');
        summary = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';

        console.log('Extracted Info from page:');
        console.log('  Title:', title);

    } catch (error) {
        console.warn(`⚠️ Scraping failed: ${error.message}. Using fallback data.`);

        // Fallback data
        title = "Quiénes son los subsecretarios de Kast";
        summary = "El presidente electo José Antonio Kast presentó a su equipo de subsecretarios que lo acompañarán en su gobierno.";
        image = null; // Will use default

        console.log('Using Fallback Info:');
        console.log('  Title:', title);
    }

    const source = 'La Tercera';
    const date = new Date(); // Current date for "most recent"
    const category = 'Sector Pesquero';
    const clientId = 'pesca';

    if (!title) {
        throw new Error('Could not extract title even with fallback');
    }

    // Fix relative image URLs
    if (image && !image.startsWith('http')) {
        image = new URL(image, TARGET_URL).toString();
    }

    console.log('  Image:', image);

    // 2. Save to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const result = await Article.findOneAndUpdate(
        { url: TARGET_URL, clientId: clientId },
        {
            title,
            url: TARGET_URL,
            source,
            date,
            category,
            summary,
            image: image || '/placeholder-news.svg',
            clientId
        },
        { upsert: true, new: true }
    );
    console.log('✅ Article saved/updated in DB');

    // 3. Update Slider
    if (fs.existsSync(SLIDER_FILE)) {
        const sliderData = JSON.parse(fs.readFileSync(SLIDER_FILE, 'utf8'));

        // Check if already in slider
        const exists = sliderData.find(item => item.linkUrl === TARGET_URL);

        if (!exists) {
            const newSliderItem = {
                imageUrl: image || 'img/fishing-banner.jpg',
                linkUrl: TARGET_URL,
                altText: title
            };

            // Add to the beginning
            sliderData.unshift(newSliderItem);

            // Keep at most 7 items
            const finalSlider = sliderData.slice(0, 7);

            fs.writeFileSync(SLIDER_FILE, JSON.stringify(finalSlider, null, 2));
            console.log('✅ Slider updated (public/slider-pesca.json)');
        } else {
            console.log('ℹ️ Article already in slider');
        }
    }

    await mongoose.disconnect();
    console.log('--- Done ---');
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
