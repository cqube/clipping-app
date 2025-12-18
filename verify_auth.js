require('dotenv').config();
const { sendDailyClipping } = require('./services/mailer');
const fs = require('fs');
const path = require('path');

// Mock Article model
const Article = require('./models/Article');
Article.find = () => ({
    sort: () => ({
        limit: (n) => Promise.resolve([
            { title: 'Test Verification Article', url: 'http://example.com/test', source: 'System', category: 'Otros', date: new Date() }
        ])
    })
});

// Configure test recipient
const RECIPIENTS_FILE = path.join(__dirname, 'data/recipients.json');
// Save original recipients
let originalRecipients = [];
if (fs.existsSync(RECIPIENTS_FILE)) {
    originalRecipients = JSON.parse(fs.readFileSync(RECIPIENTS_FILE, 'utf8'));
}

async function runTest() {
    try {
        // Use the user's email (derived from SMTP_USER) as the recipient for the test
        // But the user credentials might be wrong.
        // Let's rely on the file mechanism.
        // I'll try to send to a dummy address, or better, the sender address if valid?
        // Let's just use a hardcoded test email or one added via UI?
        // The user didn't give me a recipient email.

        // Use a dummy email that won't bounce hard or use the sender itself.
        // If SMTP_USER corresponds to cpescaboletin@gmail.com, we can send to it.
        const testEmail = process.env.SMTP_USER.replace('tu-', ''); // Try to guess the real email just for the recipient?

        console.log(`Testing with recipient: ${testEmail}`);
        fs.writeFileSync(RECIPIENTS_FILE, JSON.stringify([testEmail]));

        console.log('Running sendDailyClipping...');
        await sendDailyClipping();
        console.log('Test execution finished.');

    } catch (e) {
        console.error('Test failed:', e);
    } finally {
        // Restore
        if (originalRecipients.length > 0) {
            fs.writeFileSync(RECIPIENTS_FILE, JSON.stringify(originalRecipients));
        } else {
            // keep it empty or with existing?
            // If it was empty keep it empty
            fs.writeFileSync(RECIPIENTS_FILE, '[]');
        }
    }
}

require('dotenv').config();
runTest();
