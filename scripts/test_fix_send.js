require('dotenv').config();
const { sendEmailViaGmail } = require('../services/mailer');

async function testFix() {
    const to = 'pescaboletin@gmail.com';
    const subject = 'PRUEBA DE ASUNTO - Ene 29, 2026';
    const htmlBody = `
        <h1>Prueba de Codificación</h1>
        <p>Este es un correo de prueba para verificar que el asunto se vea correctamente con emojis.</p>
        <p>Asunto enviado: 🐟 PRUEBA DE ASUNTO 🇨🇱 - Ene 29, 2026</p>
    `;

    console.log(`Enviando correo de prueba a ${to}...`);
    try {
        await sendEmailViaGmail(to, subject, htmlBody);
        console.log('✅ Correo de prueba enviado con éxito.');
    } catch (error) {
        console.error('❌ Error al enviar el correo:', error);
    }
}

testFix();
