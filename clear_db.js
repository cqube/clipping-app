const mongoose = require('mongoose');
const Article = require('./models/Article');
require('dotenv').config();

const clearArticles = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');
        
        console.log('Clearing all articles...');
        const result = await Article.deleteMany({});
        console.log(`Deleted ${result.deletedCount} articles.`);
        
        console.log('Done.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

clearArticles();
