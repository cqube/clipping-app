process.env.CLIENT_ID = 'pesca';
process.env.PORT = process.env.PESCA_PORT || 3000;
console.log('--- STARTING CLIIPPING APP: PESCA ---');
require('./index.js');
