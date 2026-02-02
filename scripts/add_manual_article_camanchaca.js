require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Article = require('../models/Article');

const MONGODB_URI = process.env.MONGODB_URI;
const SLIDER_FILE = path.join(__dirname, '../public/slider-pesca.json');

const ARTICLE_DATA = {
    title: 'Camanchaca demanda al fisco por cambios a la Ley de Pesca y acusa un perjuicio cercano a los US$ 100 millones',
    url: 'https://www.elmercurio.com/economia/2026/02/02/camanchaca-demanda-fisco-ley-pesca.aspx', // Placeholder URL as it is a physical clip
    source: 'El Mercurio',
    date: new Date('2026-02-02T00:00:00'),
    category: 'Economía',
    summary: 'Asesorada por el abogado Jorge Bofill, la empresa acudió a tribunales tras concretarse en enero la reducción de cuotas de captura de la normativa. También lo hizo para dejar registro de que el actual gobierno “promovió e impulsó la expoliación de nuestros derechos”, indicó.',
    image: '/img/manual/camanchaca_demanda.jpg',
    clientId: 'pesca'
};

async function main() {
    console.log('--- Adding Camanchaca Article Manually ---');

    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI is not defined in .env');
        process.exit(1);
    }

    try {
        console.log('  Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('  ✅ Connected');

        // 1. Save to MongoDB
        console.log('  Saving article to DB...');
        const result = await Article.findOneAndUpdate(
            { url: ARTICLE_DATA.url, clientId: ARTICLE_DATA.clientId },
            ARTICLE_DATA,
            { upsert: true, new: true }
        );
        console.log('  ✅ Article saved/updated in DB');

        // 2. Update Slider
        console.log('  Checking slider file...');
        if (fs.existsSync(SLIDER_FILE)) {
            console.log('  Reading slider file...');
            let sliderData = JSON.parse(fs.readFileSync(SLIDER_FILE, 'utf8'));

            const newItem = {
                imageUrl: ARTICLE_DATA.image,
                linkUrl: ARTICLE_DATA.url,
                altText: ARTICLE_DATA.title
            };

            // Check if already in slider
            const existsIndex = sliderData.findIndex(item => item.linkUrl === newItem.linkUrl);
            if (existsIndex !== -1) {
                console.log('  Removing existing item from slider...');
                sliderData.splice(existsIndex, 1); // Remove old version
            }

            console.log('  Adding new item to slider...');
            sliderData.unshift(newItem);
            console.log(`  ✅ Added to slider: ${newItem.altText}`);

            // Keep at most 7 items
            const finalSlider = sliderData.slice(0, 7);

            console.log('  Writing slider file...');
            fs.writeFileSync(SLIDER_FILE, JSON.stringify(finalSlider, null, 2));
            console.log('  ✅ Slider updated (public/slider-pesca.json)');
        } else {
            console.error('❌ Slider file not found:', SLIDER_FILE);
        }

    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n--- Done ---');
    }
}

main();
