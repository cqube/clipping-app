require('dotenv').config();
const { sendConfirmationEmail } = require('../services/mailer');

const TEST_EMAIL = 'cquevedo@factorestrategico.cl';

console.log(`Attempting to send test email to ${TEST_EMAIL}...`);

sendConfirmationEmail(TEST_EMAIL)
    .then(success => {
        if (success) {
            console.log('✅ Test email sent successfully!');
        } else {
            console.error('❌ Failed to send test email.');
        }
    })
    .catch(err => {
        console.error('❌ Error executing test script:', err);
    });
