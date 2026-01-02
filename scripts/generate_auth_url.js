require('dotenv').config();
const { google } = require('googleapis');

const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;
const redirectUri = 'http://localhost'; // Standard for Desktop Apps

const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
);

const scopes = [
    'https://www.googleapis.com/auth/gmail.send'
];

const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true
});

console.log(authorizationUrl);
