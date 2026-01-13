process.env.CLIENT_ID = 'tacal';
process.env.PORT = process.env.TACAL_PORT || 3001;
console.log('--- STARTING CLIIPPING APP: TACAL ---');
require('./index.js');
