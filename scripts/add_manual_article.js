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
            title: 'Nuevo timonel de Lota Protein asume con el desafío de crecer con sustentabilidad',
            url: 'https://trade-news.cl/nuevo-timonel-de-lota-protein-asume-con-el-desafio-de-crecer-con-sustentabilidad/',
            source: 'Trade News',
            date: new Date('2026-01-17'),
            category: 'Pesca Industrial',
            summary: 'El ex gerente de Operaciones, Francisco Rodríguez Latorre, reemplazó en el cargo a Simón Gundelach, quien lideró por 30 años la compañía pesquera propiedad del conglomerado noruego-danés TripleNine. Rodríguez Latorre es ingeniero civil industrial y lleva 28 años en la compañía, habiendo ocupado diversos roles estratégicos.',
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
