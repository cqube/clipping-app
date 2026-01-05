require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { initScheduler } = require('./services/scheduler');
const { runScraper } = require('./services/scraper');
const { sendConfirmationEmail } = require('./services/mailer');
const Article = require('./models/Article');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clipping-prensa';
const RECIPIENTS_FILE = path.join(__dirname, 'data/recipients.json');
let isScraping = false;

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Middleware
app.use(express.static('public'));
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- API ROUTES ---

// Recipients Management
app.get('/api/recipients', (req, res) => {
    if (fs.existsSync(RECIPIENTS_FILE)) {
        res.sendFile(RECIPIENTS_FILE);
    } else {
        res.json([]);
    }
});

app.post('/api/recipients', (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Invalid email' });
        }

        let recipients = [];
        if (fs.existsSync(RECIPIENTS_FILE)) {
            recipients = JSON.parse(fs.readFileSync(RECIPIENTS_FILE, 'utf8'));
        }

        if (!recipients.includes(email)) {
            recipients.push(email);
            fs.writeFileSync(RECIPIENTS_FILE, JSON.stringify(recipients, null, 2));

            // Send confirmation (async, don't wait blockingly)
            sendConfirmationEmail(email);
        }

        res.json({ success: true, recipients });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/recipients', (req, res) => {
    try {
        const { email } = req.body;
        if (fs.existsSync(RECIPIENTS_FILE)) {
            let recipients = JSON.parse(fs.readFileSync(RECIPIENTS_FILE, 'utf8'));
            recipients = recipients.filter(r => r !== email);
            fs.writeFileSync(RECIPIENTS_FILE, JSON.stringify(recipients, null, 2));
            res.json({ success: true, recipients });
        } else {
            res.json({ success: true, recipients: [] });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Routes
app.get('/api/articles', async (req, res) => {
    try {
        // 1. Get articles (fetch more to ensure we have enough from priority sources)
        const articles = await Article.find().sort({ date: -1 }).limit(300);

        // 2. Define Priority Order
        const PRIORITY_SOURCES = [
            'El Mercurio',
            'La Tercera',
            'La Segunda',
            'BioBioChile', // Radio Biobío
            'ADN Radio',
            'El Desconcierto',
            'Interferencia',
            'T13',
            '24 Horas',    // TVN
            'Mega Noticias' // Meganoticias
        ];

        // 3. Sort function
        articles.sort((a, b) => {
            const indexA = PRIORITY_SOURCES.indexOf(a.source);
            const indexB = PRIORITY_SOURCES.indexOf(b.source);

            // If both are in priority list
            if (indexA !== -1 && indexB !== -1) {
                if (indexA !== indexB) {
                    return indexA - indexB; // Lower index = higher priority
                }
                // If same priority source, sort by date
                return new Date(b.date) - new Date(a.date);
            }

            // If only A is in priority list
            if (indexA !== -1) return -1;

            // If only B is in priority list
            if (indexB !== -1) return 1;

            // If neither, sort by date (newest first)
            return new Date(b.date) - new Date(a.date);
        });

        res.json(articles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/scrape', async (req, res) => {
    if (isScraping) {
        return res.status(409).json({ message: 'Scraping already in progress' });
    }

    // Set lock
    isScraping = true;
    console.log('Update requested via API. Starting background scrape...');

    // Launch background task
    runScraper()
        .then(count => {
            console.log(`Background scrape finished. ${count} new articles.`);
        })
        .catch(err => {
            console.error('Background scrape failed:', err);
        })
        .finally(() => {
            isScraping = false;
        });

    // Return immediately
    res.status(202).json({ message: 'Scraping started in background' });
});

// Start server directly without MongoDB
initScheduler();
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
