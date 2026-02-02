require('dotenv').config();
const { google } = require('googleapis');

const code = process.argv[2]; // Take code from command line arguments

if (!code) {
    console.error('❌ Error: Por favor proporciona el código de autorización como argumento.');
    console.log('Uso: node scripts/exchange_code.js "TU_CODIGO_AQUI"');
    process.exit(1);
}

const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;
const redirectUri = 'http://localhost';

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

(async () => {
    try {
        const { tokens } = await oauth2Client.getToken(code);
        console.log('\n✅ ¡Token obtenido exitosamente!\n');
        console.log('Agrega esto a tu archivo .env:\n');
        console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
        if (tokens.access_token) {
            console.log(`GMAIL_ACCESS_TOKEN=${tokens.access_token}`);
        }
        console.log('\n');
    } catch (error) {
        console.error('❌ Error:', error.response ? error.response.data : error.message);
    }
})();
