const mongoose = require('mongoose');
const Article = require('../models/Article');
require('dotenv').config();

const MONGODB_URI = "mongodb://cristianquevedo_db_user:t2NdobPm7o3Sntce@ac-5bpvqmy-shard-00-00.mm28t6i.mongodb.net:27017,ac-5bpvqmy-shard-00-01.mm28t6i.mongodb.net:27017,ac-5bpvqmy-shard-00-02.mm28t6i.mongodb.net:27017/?ssl=true&authSource=admin";

async function addArticle() {
    try {
        console.log('Conectando a MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado exitosamente.');

        const newArticle = {
            title: 'Efecto Camanchaca: Empresas pesqueras anticipan nuevas ofensivas contra el Estado por Ley de Fraccionamiento',
            url: '/img/manual/efecto-camanchaca.png',
            source: 'El Mercurio',
            date: new Date('2026-02-03'),
            category: 'Economía',
            summary: 'Firmas del sector afinan sus estrategias legales para nuevas acciones en contra del fisco por los cambios implementados en las cuotas de captura para las compañías industriales. Ante eventuales impactos económicos ligados a la normativa que reduce sus cuotas.',
            image: '/img/manual/efecto-camanchaca.png',
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
