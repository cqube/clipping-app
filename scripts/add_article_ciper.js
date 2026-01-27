const mongoose = require('mongoose');
const Article = require('../models/Article');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function addArticle() {
    try {
        console.log('Conectando a MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado exitosamente.');

        const newArticle = {
            title: 'Mineras y pesqueras recibieron $6.700 millones en subsidios pese a prohibición legal',
            url: 'https://www.ciperchile.cl/2026/01/26/mineras-y-pesqueras-recibieron-6-700-millones-en-subsidios-pese-a-prohibicion-legal/',
            source: 'CIPER Chile',
            date: new Date('2026-01-26'),
            category: 'Sector Pesquero',
            summary: 'Un reportaje de CIPER revela que empresas mineras y pesqueras recibieron millonarios beneficios tributarios por el uso de petróleo diésel, a pesar de que la ley prohíbe estos subsidios a empresas que han cometido infracciones ambientales o laborales. En el sector pesquero, varias empresas de pesca reductiva habrían sido beneficiadas indebidamente.',
            clientId: 'pesca'
        };

        console.log('Insertando/Actualizando artículo...');

        const result = await Article.findOneAndUpdate(
            { url: newArticle.url, clientId: newArticle.clientId },
            { $set: newArticle },
            { upsert: true, new: true, runValidators: true }
        );

        console.log('✅ Artículo procesado correctamente:');
        console.log(JSON.stringify(result, null, 2));

        await mongoose.disconnect();
        process.exit(0);

    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

addArticle();
