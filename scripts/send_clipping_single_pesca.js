require('dotenv').config();
const axios = require('axios');
const { generateHtml, sendEmailViaGmail } = require('../services/mailer');

const APP_URL = 'https://clipping-app-production.up.railway.app';

async function main() {
    console.log('--- Single Clipping Send Test (API Mode) ---');

    try {
        console.log(`Fetching articles from ${APP_URL}/api/articles...`);
        const response = await axios.get(`${APP_URL}/api/articles`);
        const articles = response.data;

        console.log(`Received ${articles.length} articles.`);

        // 2. Get articles from the last 4 days (Sync with sendDailyClipping logic)
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 4);

        let articlesToSend = articles.filter(a => new Date(a.date) > cutoff);

        if (articlesToSend.length === 0) {
            console.log('No recent articles found. Sending latest 20 as fallback.');
            articlesToSend = articles.slice(0, 20);
        }

        const html = generateHtml(articlesToSend);

        // Subject format (Spanish): 🐟NOTICIAS DE PESCA🇨🇱 - Ene 27, 2026
        const date = new Date();
        const monthShort = date.toLocaleString('es-CL', { month: 'short' }).replace('.', '');
        const month = monthShort.charAt(0).toUpperCase() + monthShort.slice(1);
        const day = date.getDate();
        const year = date.getFullYear();
        const formattedDate = `${month} ${day}, ${year}`;

        const subject = `🐟NOTICIAS DE PESCA🇨🇱 - ${formattedDate}`;
        const recipient = 'pescaboletin@gmail.com';

        console.log(`Sending clipping to ${recipient}...`);
        await sendEmailViaGmail(recipient, subject, html);
        console.log('✅ Sent successfully!');

    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();
