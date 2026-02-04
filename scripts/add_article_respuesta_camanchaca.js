const mongoose = require('mongoose');
const Article = require('../models/Article');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGODB_URI = "mongodb://cristianquevedo_db_user:1SrGCb53YWAbI9va@ac-5bpvqmy-shard-00-00.mm28t6i.mongodb.net:27017,ac-5bpvqmy-shard-00-01.mm28t6i.mongodb.net:27017,ac-5bpvqmy-shard-00-02.mm28t6i.mongodb.net:27017/?ssl=true&authSource=admin";
const SLIDER_FILE = path.join(__dirname, '../public/slider-pesca.json');

async function addArticle() {
    try {
        console.log('Conectando a MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado exitosamente.');

        const webUrl = 'https://www.mundoacuicola.cl/new/hernan-cortes-respuesta-a-camanchaca-es-inmoral-y-una-verguenza-nacional/';
        const imageUrl = '/img/manual/respuesta-camanchaca.png';

        const newArticle = {
            title: 'Respuesta a Camanchaca',
            url: webUrl,
            source: 'Carta al Director / CONDEPP',
            date: new Date('2026-02-04'),
            category: 'Ley de Pesca', // Required for email inclusion in current mailer.js logic
            summary: 'Hernán Cortés, Presidente de CONDEPP, cuestiona la demanda de Camanchaca contra el Estado por la Ley de Fraccionamiento. Sostiene que los recursos del mar no son propiedad privada y que la nueva ley redistribuye con justicia el acceso a un bien común que fue indebidamente concentrado.',
            image: imageUrl,
            clientId: 'pesca'
        };

        console.log('Insertando/Actualizando artículo en DB...');

        const result = await Article.findOneAndUpdate(
            { url: newArticle.url, clientId: newArticle.clientId },
            { $set: newArticle },
            { upsert: true, new: true, runValidators: true }
        );

        console.log('✅ Artículo procesado correctamente en DB');

        // Update Slider
        if (fs.existsSync(SLIDER_FILE)) {
            console.log('Actualizando slider-pesca.json...');
            let sliderData = JSON.parse(fs.readFileSync(SLIDER_FILE, 'utf8'));

            const newItem = {
                imageUrl: imageUrl,
                linkUrl: webUrl,
                altText: 'Respuesta a Camanchaca - Hernán Cortés CONDEPP'
            };

            // Remove existing if any (by link)
            sliderData = sliderData.filter(item => item.linkUrl !== webUrl);

            // Add to start
            sliderData.unshift(newItem);

            // Keep limit (7)
            const finalSlider = sliderData.slice(0, 7);

            fs.writeFileSync(SLIDER_FILE, JSON.stringify(finalSlider, null, 2));
            console.log('✅ Slider actualizado.');
        }

        await mongoose.disconnect();
        console.log('Desconectado de MongoDB.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

addArticle();
