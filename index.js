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
const ARTICLES_FILE = path.join(__dirname, 'data/latest_articles.json');
let isScraping = false;

// Connect to MongoDB with improved options
const connectDB = async () => {
    try {
        console.log('⏳ Connecting to MongoDB Atlas...');
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            heartbeatFrequencyMS: 2000,
        });
        console.log('✅ Connected to MongoDB Atlas');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        // On critical connection error at startup, we might want to exit
        // but for now we'll just log and let the app fail gracefully on requests
    }
};

// Middleware
app.use(express.static('public'));
app.use(express.json());

const CLIENT_ID = process.env.CLIENT_ID || 'pesca';

// Root Route - Serve correct HTML
app.get('/', (req, res) => {
    const file = CLIENT_ID === 'tacal' ? 'tacal.html' : 'pesca.html';
    res.sendFile(path.join(__dirname, 'public', file));
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
        // 1. Get articles for current client
        const articles = await Article.find({ clientId: CLIENT_ID })
            .sort({ date: -1 })
            .limit(300);

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

        // 1. Fallback/Merge: Always check the local file for potentially newer or missing news
        if (fs.existsSync(ARTICLES_FILE)) {
            try {
                const fileArticles = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf8'));
                const existingUrls = new Set(articles.map(a => a.url));
                fileArticles.forEach(a => {
                    if (!existingUrls.has(a.url)) {
                        articles.push(a);
                    }
                });
            } catch (fileErr) {
                console.error('Error loading articles from file fallback:', fileErr);
            }
        }

        // 2. Smarter Sorting: By Day (Newest first), then by PRIORITY_SOURCES, then by exact Date
        articles.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);

            // Group by Day (normalized to YYYY-MM-DD)
            const dayA = dateA.toISOString().split('T')[0];
            const dayB = dateB.toISOString().split('T')[0];

            if (dayA !== dayB) {
                return dayB.localeCompare(dayA); // Newer day first
            }

            // Within the same day, check priority
            const indexA = PRIORITY_SOURCES.indexOf(a.source);
            const indexB = PRIORITY_SOURCES.indexOf(b.source);

            if (indexA !== -1 && indexB !== -1) {
                if (indexA !== indexB) return indexA - indexB; // Lower index = higher priority
            } else if (indexA !== -1) {
                return -1;
            } else if (indexB !== -1) {
                return 1;
            }

            // If same priority (or neither), sort by exact time within the day
            return dateB - dateA;
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

// Get last update timestamp
app.get('/api/last-update', async (req, res) => {
    try {
        const latestArticle = await Article.findOne().sort({ date: -1 });
        if (latestArticle) {
            res.json({ lastUpdate: latestArticle.date });
        } else {
            res.json({ lastUpdate: null });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Manually send email
app.post('/api/send-email', async (req, res) => {
    try {
        const { sendDailyClipping } = require('./services/mailer');
        console.log('Manual email send requested via API...');

        // Send email synchronously to report errors
        await sendDailyClipping();

        console.log('Manual email sent successfully');
        res.json({ success: true, message: 'Email sent successfully' });
    } catch (err) {
        console.error('Error sending manual email:', err);
        res.status(500).json({ error: err.message, details: 'Check server logs for more info.' });
    }
});

// Main Initialization
const startApp = async () => {
    // 1. Wait for MongoDB
    await connectDB();

    // 2. Init Scheduler
    initScheduler();

    // 3. Start Express
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    });
};

startApp();
