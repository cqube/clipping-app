require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('./models/Article');

const uri = process.env.MONGODB_URI;

(async () => {
    try {
        await mongoose.connect(uri);
        const count = await Article.countDocuments();
        console.log('✅ Articles in DB:', count);

        const recent = await Article.findOne().sort({ date: -1 });
        console.log('Latest article:', recent ? recent.title : 'None');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
    }
})();
