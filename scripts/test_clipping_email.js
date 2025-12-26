require('dotenv').config();
const { sendDailyClipping } = require('../services/mailer');

console.log('Enviando clipping de prueba...');

sendDailyClipping()
    .then(() => {
        console.log('✅ Proceso completado');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
