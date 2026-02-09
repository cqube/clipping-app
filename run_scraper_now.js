require('dotenv').config();
const { runScraper } = require('./services/scraper');
const mongoose = require('mongoose');

// Try SRV connection first, fallback to direct connection if DNS fails
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/clipping-prensa';

// If using mongodb+srv and it might timeout, prepare a fallback
const isSrvConnection = MONGODB_URI.startsWith('mongodb+srv://');
let directConnectionUri = null;

if (isSrvConnection) {
    // Extract credentials and database from SRV URI
    const match = MONGODB_URI.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)(\/.*)?(\?.*)?$/);
    if (match) {
        const [, username, password, cluster, dbPath, queryParams] = match;
        // Use known shard hosts directly
        directConnectionUri = `mongodb://${username}:${password}@ac-5bpvqmy-shard-00-00.mm28t6i.mongodb.net:27017,ac-5bpvqmy-shard-00-01.mm28t6i.mongodb.net:27017,ac-5bpvqmy-shard-00-02.mm28t6i.mongodb.net:27017${dbPath || '/test'}?replicaSet=atlas-wgzqsf-shard-0&ssl=true&authSource=admin`;
    }
}

async function run() {
    try {
        console.log('Connecting to MongoDB...');

        // Try SRV connection first
        try {
            await mongoose.connect(MONGODB_URI, {
                serverSelectionTimeoutMS: 10000,
                connectTimeoutMS: 10000
            });
            console.log('✅ Connected to MongoDB via SRV');
        } catch (srvError) {
            if (directConnectionUri && (srvError.code === 'ETIMEOUT' || srvError.message.includes('queryTxt'))) {
                console.log('⚠️ SRV connection failed with DNS timeout, trying direct connection...');
                await mongoose.connect(directConnectionUri, {
                    serverSelectionTimeoutMS: 10000,
                    connectTimeoutMS: 10000
                });
                console.log('✅ Connected to MongoDB via direct hosts');
            } else {
                throw srvError;
            }
        }

        console.log('🔄 Ejecutando scraper manualmente...\n');
        await runScraper();
        console.log('\n✅ Scraping completado');

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Error:', err);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit(1);
    }
}

run();
