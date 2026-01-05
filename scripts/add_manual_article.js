const fs = require('fs');
const path = require('path');
const https = require('https');

const ARTICLES_FILE = path.join(__dirname, '../data/articles.json');
const SLIDER_FILE = path.join(__dirname, '../public/slider-config.json');

const NEW_ARTICLE = {
    title: "Fin a la Ley Longueira: en la práctica nuevo fraccionamiento entra en 2026 y artesanales piden garantías sociales",
    url: "https://www.elciudadano.com/chile/fin-a-la-ley-longueira-en-la-practica-nuevo-fraccionamiento-entra-en-2026-y-artesanales-piden-garantias-sociales/01/02/",
    source: "El Ciudadano",
    category: "Ley de Pesca",
    date: new Date().toISOString(), // Use current time to ensure it's picked up
    summary: "Nuevo fraccionamiento entra en 2026 y artesanales piden garantías sociales tras el fin práctico de la Ley Longueira."
};

// Function to fetch OG image
const fetchOgImage = (url) => {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const match = data.match(/<meta property="og:image" content="([^"]+)"/);
                resolve(match ? match[1] : null);
            });
        }).on('error', () => resolve(null));
    });
};

async function run() {
    console.log('Adding manual article...');

    // 1. Update articles.json
    let articles = [];
    if (fs.existsSync(ARTICLES_FILE)) {
        articles = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf8'));
    }

    // Check if already exists to avoid duplicates
    const exists = articles.find(a => a.url === NEW_ARTICLE.url);
    if (!exists) {
        articles.push(NEW_ARTICLE);
        fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articles, null, 2));
        console.log('✅ Article added to articles.json');
    } else {
        console.log('⚠️ Article already in articles.json');
    }

    // 2. Update slider-config.json
    let sliderConfig = [];
    if (fs.existsSync(SLIDER_FILE)) {
        sliderConfig = JSON.parse(fs.readFileSync(SLIDER_FILE, 'utf8'));
    }

    const imageUrl = await fetchOgImage(NEW_ARTICLE.url) || "https://www.elciudadano.com/wp-content/uploads/2024/12/pescadores-artesanales.jpg"; // Fallback

    const sliderEntry = {
        imageUrl: imageUrl,
        linkUrl: NEW_ARTICLE.url,
        altText: NEW_ARTICLE.title
    };

    // Add to beginning
    sliderConfig.unshift(sliderEntry);
    // Limit to 10
    if (sliderConfig.length > 10) sliderConfig = sliderConfig.slice(0, 10);

    fs.writeFileSync(SLIDER_FILE, JSON.stringify(sliderConfig, null, 2));
    console.log('✅ Article added to slider-config.json with image:', imageUrl);

}

run().catch(console.error);
