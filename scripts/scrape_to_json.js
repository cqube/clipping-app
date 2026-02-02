require('dotenv').config();
const { runScraper } = require('../services/scraper');
const mongoose = require('mongoose');

async function run() {
    console.log('--- Starting JSON-only Scraper ---');

    // We intentionally DO NOT connect to MongoDB here.
    // The runScraper service has its own internal check for mongoose.connection.readyState.

    try {
        console.log('🔄 Ejecutando scraper (sin DB)...\n');
        await runScraper();
        console.log('\n✅ Scraping completado (datos guardados en JSON)');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Error:', err);
        process.exit(1);
    }
}

run();
