const mongoose = require('mongoose');
const Article = require('../models/Article');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const SLIDER_FILE = path.join(__dirname, '../public/slider-pesca.json');

const newArticle = {
    title: 'Ley de Pesca: comisión aprobó 60 indicaciones presentadas por el diputado Bobadilla que son idénticas a propuestas de la gremial Sonapesca',
    url: 'https://www.ciperchile.cl/2026/02/02/ley-de-pesca-comision-aprobo-60-indicaciones-presentadas-por-el-diputado-bobadilla-que-son-identicas-a-propuestas-de-la-gremial-sonapesca/',
    source: 'CIPER Chile',
    date: new Date('2026-02-02'),
    category: 'Ley de Pesca',
    summary: 'Un reportaje de CIPER revela que la Comisión de Pesca aprobó decenas de indicaciones presentadas por el diputado Sergio Bobadilla (UDI) que coinciden textualmente con propuestas de la gremial Sonapesca. Estas modificaciones afectan áreas críticas de la nueva Ley de Pesca, como el régimen sancionatorio y la fiscalización, eliminando incluso la calidad de ministros de fe de los funcionarios de Sernapesca.',
    image: 'https://www.ciperchile.cl/wp-content/uploads/web-bobadilla.png',
    clientId: 'pesca'
};

async function processArticle() {
    try {
        console.log('Conectando a MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Conectado exitosamente.');

        // 1. Update Database
        console.log('Insertando/Actualizando artículo en DB...');
        const dbResult = await Article.findOneAndUpdate(
            { url: newArticle.url, clientId: newArticle.clientId },
            { $set: newArticle },
            { upsert: true, new: true, runValidators: true }
        );
        console.log('✅ Artículo en DB actualizado.');

        // 2. Update Slider JSON
        console.log('Actualizando slider-pesca.json...');
        let sliderData = [];
        if (fs.existsSync(SLIDER_FILE)) {
            sliderData = JSON.parse(fs.readFileSync(SLIDER_FILE, 'utf8'));
        }

        // Remove if already exists in slider to avoid duplicates
        sliderData = sliderData.filter(item => item.linkUrl !== newArticle.url);

        // Add to the beginning
        sliderData.unshift({
            imageUrl: newArticle.image,
            linkUrl: newArticle.url,
            altText: newArticle.title
        });

        // Keep a reasonable number of items
        if (sliderData.length > 10) sliderData = sliderData.slice(0, 10);

        fs.writeFileSync(SLIDER_FILE, JSON.stringify(sliderData, null, 2));
        console.log('✅ slider-pesca.json actualizado.');

        // 3. Update Latest Articles JSON (Fallback)
        console.log('Actualizando latest_articles.json...');
        const ARTICLES_FILE = path.join(__dirname, '../data/latest_articles.json');
        let articlesData = [];
        if (fs.existsSync(ARTICLES_FILE)) {
            articlesData = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf8'));
        }

        // Remove if already exists
        articlesData = articlesData.filter(a => a.url !== newArticle.url);
        // Add to the front
        articlesData.unshift(newArticle);
        // Keep limited
        if (articlesData.length > 50) articlesData = articlesData.slice(0, 50);

        fs.writeFileSync(ARTICLES_FILE, JSON.stringify(articlesData, null, 2));
        console.log('✅ latest_articles.json actualizado.');

        await mongoose.disconnect();
        console.log('Desconectado de MongoDB.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

processArticle();
