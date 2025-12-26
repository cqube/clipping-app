require('dotenv').config();
const { sendConfirmationEmail } = require('../services/mailer');

const testEmail = process.argv[2] || 'cquevedo@factorestrategico.cl';

console.log(`Enviando email de prueba a: ${testEmail}`);

sendConfirmationEmail(testEmail)
    .then(success => {
        if (success) {
            console.log('✅ Email enviado correctamente via Gmail API');
        } else {
            console.log('❌ Error al enviar el email');
        }
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err.message);
        process.exit(1);
    });
