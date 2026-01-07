require('dotenv').config();
const { runScraper } = require('./services/scraper');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

async function run() {
    console.log('🔄 Iniciando actualización (Scraping)...');

    // We try to run the scraper. 
    // Since runScraper() uses Mongoose to save, and it fails, 
    // I will temporarily monkey-patch Article.findOne and Article.create 
    // to just collect in an array if it fails to connect.

    const Article = require('./models/Article');
    const collectedArticles = [];

    // Backup original methods
    const originalFindOne = Article.findOne;
    const originalCreate = Article.create;

    Article.findOne = async (query) => {
        // Just return null so it "saves" everything or at least continues
        return null;
    };

    Article.create = async (data) => {
        collectedArticles.push(data);
        return data;
    };

    try {
        // We still call runScraper. It will try to connect to Mongo at the start of runScraper.
        // If it hangs there, we are still stuck.
        // Let's modify runScraper logic if possible or just do a manual scrape here.

        console.log('Fetching news items...');
        // Instead of runScraper which has fixed logic, let's use the components
        const { scrapeSite } = require('./services/scraper');
        // I need SITES and RSS_FEEDS but they are not exported.
        // I'll just run runScraper and hope the connect doesn't block forever 
        // if I don't use the result of findOne.

        // Actually, runScraper calls loginToElMercurio and loginToDf first.

        const count = await runScraper();
        console.log(`\n✅ Scraping completado. ${collectedArticles.length} artículos recolectados.`);

        const filePath = path.join(__dirname, 'data/latest_articles.json');
        fs.writeFileSync(filePath, JSON.stringify(collectedArticles, null, 2));
        console.log(`Artículos guardados en ${filePath}`);

    } catch (err) {
        console.error('\n❌ Error durante el scraping:', err);
    } finally {
        // If we want to try to save to DB anyway later
    }
}

run();
