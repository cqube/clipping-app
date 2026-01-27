const fs = require('fs');
const path = require('path');

const RECIPIENTS_FILE = path.join(__dirname, '../data/recipients.json');
const newEmails = [
    'pescanoticias@gmail.com',
    'cquevedo@factorestrategico.cl',
    'mtrivelli@factorestrategico.cl',
    'sgundelach@lotaprotein.cl',
    'riola.solano@gmail.com',
    'dtrivelli@ek.cl',
    'vmunoz@ek.cl',
    'rgalvez@ek.cl',
    'fenasparchile@hotmail.com',
    'jmontenegros@gmail.com',
    'nmunoz@aylwin.cl',
    'smolina@influencia.cl',
    'jorgebustosnilsson@gmail.com',
    'eduardoquiroz2013@gmail.com',
    'joseverdugo2010@gmail.com',
    'pascual.aguilera.sarmiento@gmail.com',
    'saragarrido2021@gmail.com',
    'smayorga.miranda@gmail.com',
    'beta2023@gmail.com',
    'gigliavaccani@eldesconcierto.cl',
    'matiasrojas@eldesconcierto.cl',
    'bernardocaro1968@gmail.com',
    'Molivares@elementalci.cl',
    'vt.munozriveros@gmail.com'
];

function addEmails() {
    let recipients = [];
    if (fs.existsSync(RECIPIENTS_FILE)) {
        recipients = JSON.parse(fs.readFileSync(RECIPIENTS_FILE, 'utf8'));
    }

    const initialCount = recipients.length;
    newEmails.forEach(email => {
        const trimmed = email.trim();
        if (trimmed && !recipients.includes(trimmed)) {
            recipients.push(trimmed);
        }
    });

    // Sort alphabetically for better management
    recipients.sort();

    fs.writeFileSync(RECIPIENTS_FILE, JSON.stringify(recipients, null, 2));
    console.log(`✅ added ${recipients.length - initialCount} new emails. Total: ${recipients.length}`);
}

addEmails();
