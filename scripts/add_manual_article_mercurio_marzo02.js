const mongoose = require('mongoose');
const Article = require('../models/Article');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

// Prepare direct connection fallback for SRV (similar to index.js)
const isSrvConnection = MONGODB_URI.startsWith('mongodb+srv://');
let directConnectionUri = null;

if (isSrvConnection) {
    const match = MONGODB_URI.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)(\/.*)?(\?.*)?$/);
    if (match) {
        const [, username, password, cluster, dbPath, queryParams] = match;
        directConnectionUri = `mongodb://${username}:${password}@ac-5bpvqmy-shard-00-00.mm28t6i.mongodb.net:27017,ac-5bpvqmy-shard-00-01.mm28t6i.mongodb.net:27017,ac-5bpvqmy-shard-00-02.mm28t6i.mongodb.net:27017${dbPath || '/test'}?replicaSet=atlas-wgzqsf-shard-0&ssl=true&authSource=admin`;
    }
}

async function addArticle() {
    try {
        console.log('Conectando a MongoDB...');
        try {
            await mongoose.connect(MONGODB_URI, {
                serverSelectionTimeoutMS: 15000,
                bufferCommands: false,
            });
            console.log('Conectado exitosamente via SRV.');
        } catch (srvError) {
            if (directConnectionUri && (srvError.code === 'ETIMEOUT' || srvError.message.includes('queryTxt'))) {
                console.log('⚠️ SRV connection failed/timed out, trying direct connection...');
                await mongoose.connect(directConnectionUri, {
                    serverSelectionTimeoutMS: 15000,
                    bufferCommands: false,
                });
                console.log('Conectado exitosamente via direct hosts.');
            } else {
                throw srvError;
            }
        }

        const newArticle = {
            title: 'Ciencia aplicada al mar: cuatro proyectos liderados por mujeres en Chile',
            url: 'https://www.emol.com/noticias/Ciencia-Tecnologia/2026/03/02/ciencia-mar-mujeres-chile.html',
            source: 'El Mercurio',
            date: new Date('2026-03-02'),
            category: 'Ciencia y Tecnología',
            summary: 'Cuatro líderes científicas chilenas impulsan proyectos innovadores: Marcela Ruiz (Acústica Marina), María José de la Fuente (Huiro Regenerativo), Catalina Landeta (Mycoseaweed) y Gabriela Villouta (Bioproc). Estos desarrollos incluyen monitoreo hidroacústico con IA, nuevos ingredientes alimenticios y dispositivos para limpiar aguas.',
            image: '',
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
