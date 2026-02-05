require('dotenv').config();
const { generateHtml } = require('../services/mailer');

async function main() {
    console.log('--- Simulate El Mercurio Link ---');

    const mockArticles = [
        {
            title: 'El Mercurio Article with Google URL',
            source: 'El Mercurio',
            date: new Date(),
            url: 'https://news.google.com/rss/articles/CBMipgFB...',
            image: 'https://lh3.googleusercontent.com/thumbnail',
            category: 'Pesca Industrial'
        },
        {
            title: 'Normal Article',
            source: 'BioBio',
            date: new Date(),
            url: 'https://biobiochile.cl/noticia',
            image: 'https://biobio.cl/img.jpg',
            category: 'Pesca Artesanal'
        }
    ];

    const html = generateHtml(mockArticles);

    // Extract links
    console.log('\nGenerated HTML Links:');
    const regex = /<h2><a href="([^"]+)">([^<]+)<\/a><\/h2>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        console.log(`Title: ${match[2]}`);
        console.log(`Href:  ${match[1]}`);
        console.log('---');
    }
}

main().catch(console.error);
