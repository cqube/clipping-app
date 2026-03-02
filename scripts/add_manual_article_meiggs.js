const mongoose = require('mongoose');
const Article = require('../models/Article');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Direct connection fallback logic from index.js
 */
const getMongoUri = () => {
    const isSrvConnection = MONGODB_URI.startsWith('mongodb+srv://');
    if (isSrvConnection) {
        const match = MONGODB_URI.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)(\/.*)?(\?.*)?$/);
        if (match) {
            const [, username, password, cluster, dbPath, queryParams] = match;
            return `mongodb://${username}:${password}@ac-5bpvqmy-shard-00-00.mm28t6i.mongodb.net:27017,ac-5bpvqmy-shard-00-01.mm28t6i.mongodb.net:27017,ac-5bpvqmy-shard-00-02.mm28t6i.mongodb.net:27017${dbPath || '/test'}?replicaSet=atlas-wgzqsf-shard-0&ssl=true&authSource=admin`;
        }
    }
    return MONGODB_URI;
};

async function addArticle() {
    try {
        console.log('Conectando a MongoDB...');
        try {
            await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
        } catch (srvErr) {
            console.log('SRV connection failed, trying direct connection...');
            await mongoose.connect(getMongoUri());
        }
        console.log('Conectado exitosamente.');

        const newArticle = {
            title: 'Modelo Meiggs en la pesca',
            url: 'https://digital.elmercurio.com/2026/02/10/A/1?scroll=0#carta-modelo-meiggs',
            source: 'El Mercurio',
            date: new Date('2026-02-10T11:00:00Z'),
            category: 'Pesca Industrial',
            summary: 'Marcel Moenne Muñoz, Gerente General de PacificBlu, advierte sobre la inacción del Estado frente a la pesca ilegal de la merluza común, comparándola con el comercio ilegal en el barrio Meiggs. Señala que este mercado ilícito mueve 50 mil millones de pesos al año y pone en riesgo la sostenibilidad del recurso y el empleo formal.',
            image: '/placeholder-news.svg',
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
