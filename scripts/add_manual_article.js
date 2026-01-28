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
            title: 'Incertidumbre en pesqueros artesanales por gabinete de Kast y magro balance del gobierno actual',
            url: 'https://www.elmostrador.cl/noticias/pais/2026/01/27/incertidumbre-en-pesqueros-artesanales-por-gabinete-de-kast-y-magro-balance-del-gobierno-actual/',
            source: 'El Mostrador',
            date: new Date('2026-01-27'),
            category: 'Pesca Artesanal',
            summary: 'El Gobierno cierra su mandato con la aprobación de la Ley de Fraccionamiento, pero sin concretar una nueva Ley de Pesca. El cambio de administración y la nominación del equipo económico de José Antonio Kast reordenan el escenario político del sector.',
            image: 'https://media-front.elmostrador.cl/2025/03/pag-13-pesca-industrial-foto-diario-constitucional-cl-850x500-1-700x412.jpg',
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
        console.log('Desconectado de MongoDB.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Error al insertar el artículo:', err);
        process.exit(1);
    }
}

addArticle();
