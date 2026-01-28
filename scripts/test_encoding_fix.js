require('dotenv').config();
const { google } = require('googleapis');
const { Buffer } = require('buffer');

// Helper: Encode string to Base64URL
const encodeBase64 = (str) => {
    return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const getGmailClient = () => {
    const oAuth2Client = new google.auth.OAuth2(process.env.GMAIL_CLIENT_ID, process.env.GMAIL_CLIENT_SECRET);
    oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
    return oAuth2Client;
};

async function testEncoding(useCRLF = false) {
    const auth = getGmailClient();
    const gmail = google.gmail({ version: 'v1', auth });

    // Test subject with emojis
    const subject = `🐟NOTICIAS DE PESCA🇨🇱 - Test ${useCRLF ? 'CRLF' : 'LF'}`;
    const to = process.env.GMAIL_USER_EMAIL;
    const from = `"Clipping Test" <${process.env.GMAIL_USER_EMAIL}>`;

    const separator = useCRLF ? '\r\n' : '\n';

    const messageParts = [
        `From: ${from}`,
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
        '',
        '<h1>Test encoding</h1>'
    ];

    const raw = encodeBase64(messageParts.join(separator));

    try {
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw }
        });
        console.log(`Email sent with ${useCRLF ? 'CRLF' : 'LF'}`);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run both tests
async function runTests() {
    console.log('Sending test emails...');
    // await testEncoding(false); // Potential problematic one
    await testEncoding(true);  // Recommended fix
}

runTests();
