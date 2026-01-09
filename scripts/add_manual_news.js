require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('../models/Article');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clipping-prensa';

const manualArticles = [
    {
        title: "Presidente del Consejo por la Defensa del Patrimonio Pesquero critica designación de Jorge Quiroz",
        source: "El Ciudadano",
        date: new Date('2025-01-08'),
        category: "Ley de Pesca",
        summary: "Nombrar a Jorge Quiroz como ministro de hacienda es una preocupación para el país. No sólo fue el ideólogo que blindó a la industria pesquera, produciendo informes favorables a la asignación de recursos a dedo en la corrupta Ley de Pesca.",
        url: "https://www.elciudadano.com/actualidad/presidente-del-consejo-por-la-defensa-del-patrimonio-pesquero-critica-designacion-de-jorge-quiroz/01/08/",
        image: "https://www.elciudadano.com/wp-content/uploads/2025/01/Quiroz-Ministro-de-Hacienda.jpg"
    },
    {
        title: "Fin a la Ley Longueira: en la práctica nuevo fraccionamiento entra en 2026 y artesanales piden garantías sociales",
        source: "El Ciudadano",
        date: new Date(),
        category: "Ley de Pesca",
        summary: "Nuevo fraccionamiento entra en 2026 y artesanales piden garantías sociales tras el fin práctico de la Ley Longueira.",
        url: "https://www.elciudadano.com/chile/fin-a-la-ley-longueira-en-la-practica-nuevo-fraccionamiento-entra-en-2026-y-artesanales-piden-garantias-sociales/01/02/",
        image: "img/fraccionamiento-pesca.jpg"
    }
];

(async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        let addedCount = 0;

        for (const article of manualArticles) {
            // Check by URL (unique key)
            const exists = await Article.findOne({ url: article.url });

            if (!exists) {
                // If checking by title is needed as fallback (since some URLs might be made up)
                const titleExists = await Article.findOne({ title: article.title });

                if (!titleExists) {
                    await Article.create(article);
                    console.log(`Added: ${article.title}`);
                    addedCount++;
                } else {
                    console.log(`Skipped (Duplicate Title): ${article.title}`);
                }
            } else {
                console.log(`Skipped (Duplicate URL): ${article.title}`);
            }
        }

        console.log(`\nOperation Complete. Added ${addedCount} articles.`);
    } catch (err) {
        console.error('Error adding manual news:', err);
    } finally {
        await mongoose.disconnect();
    }
})();
