require('dotenv').config();
const { google } = require('googleapis');

const code = '4/0ASc3gC2azt1uO3vQBlVAWZ-qGJb4ayE_bgDcFomzDrPJ0C7ZauhKbSEAIsmjKLBMJyMtNg';
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
        console.log('\n');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
})();
