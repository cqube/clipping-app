require('dotenv').config();
const { google } = require('googleapis');

const code = '4/0ASc3gC0Zs4CAS5laTsTvd4MjJnX3tcd-66aHor1iA4hb20N8Fm7HJRSffH5Bt5EluAj5kg';
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
