require('dotenv').config();
const { google } = require('googleapis');

const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;
const redirectUri = 'http://localhost';

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

const scopes = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email'
];

const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Crucial for refresh_token
    scope: scopes,
    prompt: 'consent' // Force new refresh token
});

console.log('--- URL DE AUTENTICACIÓN ---');
console.log(url);
console.log('----------------------------');
