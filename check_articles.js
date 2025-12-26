require('dotenv').config();
const Article = require('./models/Article');
const mongoose = require('mongoose');

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clipping');

        const articles = await Article.find().sort({ date: -1 }).limit(20);

        console.log(`Total de artículos en BD: ${await Article.countDocuments()}`);
        console.log('\nÚltimos 20 artículos por fecha:\n');

        articles.forEach((art, i) => {
            const date = new Date(art.date);
            console.log(`${i + 1}. ${date.toLocaleDateString('es-CL')} - ${art.title.substring(0, 70)}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
