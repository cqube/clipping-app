const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { initScheduler } = require('./services/scheduler');
const { runScraper } = require('./services/scraper');
const Article = require('./models/Article');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clipping-prensa';

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Routes
app.get('/api/articles', async (req, res) => {
    try {
        const articles = await Article.find().sort({ date: -1 }).limit(100);
        res.json(articles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/scrape', async (req, res) => {
    try {
        const count = await runScraper();
        res.json({ message: 'Scrape finished', newArticles: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start server directly without MongoDB
initScheduler();
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
