require('dotenv').config();
const { runScraper } = require('./services/scraper');

console.log('🔄 Ejecutando scraper manualmente...\n');

runScraper()
    .then(() => {
        console.log('\n✅ Scraping completado');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ Error:', err);
        process.exit(1);
    });
