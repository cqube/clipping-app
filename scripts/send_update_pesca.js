require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { generateHtml, sendEmailViaGmail } = require('../services/mailer');

const ARTICLE_DATA = {
    title: 'Camanchaca demanda al fisco por cambios a la Ley de Pesca y acusa un perjuicio cercano a los US$ 100 millones',
    url: 'https://clipping-app-production.up.railway.app/img/manual/camanchaca_demanda.jpg',
    source: 'El Mercurio',
    date: new Date('2026-02-02T00:00:00'),
    category: 'Ley de Pesca', // Specific category for highlighting
    summary: 'Asesorada por el abogado Jorge Bofill, la empresa acudió a tribunales tras concretarse en enero la reducción de cuotas de captura de la normativa. También lo hizo para dejar registro de que el actual gobierno “promovió e impulsó la expoliación de nuestros derechos”, indicó.',
    image: '/img/manual/camanchaca_demanda.jpg',
    clientId: 'pesca'
};

async function main() {
    console.log('--- Sending Pesca Update Clipping ---');

    try {
        // 1. Load articles from local storage as fallback/basis
        const dataPath = path.join(__dirname, '../data/latest_articles.json');
        let articles = [];
        if (fs.existsSync(dataPath)) {
            articles = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        }

        // 2. Ensure Camanchaca is at the top
        // Filter out if already exists by URL
        articles = articles.filter(a => a.url !== ARTICLE_DATA.url);
        // Add to the front
        articles.unshift(ARTICLE_DATA);

        // 3. Generate HTML
        // We want to highlight the first article.
        // We'll modify the generateHtml function or create a custom one here.
        let html = generateCustomHtml(articles);

        // 4. Send Email
        const date = new Date();
        const monthShort = date.toLocaleString('es-CL', { month: 'short' }).replace('.', '');
        const month = monthShort.charAt(0).toUpperCase() + monthShort.slice(1);
        const day = date.getDate();
        const year = date.getFullYear();
        const formattedDate = `${month} ${day}, ${year}`;

        const subject = `ACTUALIZACIÓN: NOTICIAS DE PESCA - ${formattedDate}`;
        const recipient = 'pescaboletin@gmail.com'; // Testing or single send if requested?

        // Actually the user wants to "enviar un mensaje de actualización", 
        // which usually implies sending to all recipients.
        const recipientsPath = path.join(__dirname, '../data/recipients.json');
        const recipients = JSON.parse(fs.readFileSync(recipientsPath, 'utf8'));

        console.log(`Sending update to ${recipients.length} recipients...`);

        const { google } = require('googleapis');
        const getGmailClient = () => {
            const oAuth2Client = new google.auth.OAuth2(process.env.GMAIL_CLIENT_ID, process.env.GMAIL_CLIENT_SECRET);
            oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
            return oAuth2Client;
        };
        const encodeBase64 = (str) => Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        const createRawEmail = (to, subject, htmlBody, bcc = []) => {
            const from = process.env.GMAIL_USER_EMAIL || 'pescaboletin@gmail.com';
            const messageParts = [
                `From: "Clipping de Prensa" <${from}>`,
                `To: ${to}`,
            ];
            if (bcc.length > 0) messageParts.push(`Bcc: ${bcc.join(', ')}`);
            messageParts.push('Content-Type: text/html; charset=UTF-8', 'MIME-Version: 1.0', `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`, '', htmlBody);
            return encodeBase64(messageParts.join('\r\n'));
        };

        const auth = getGmailClient();
        const gmail = google.gmail({ version: 'v1', auth });
        const raw = createRawEmail(process.env.GMAIL_USER_EMAIL || 'pescaboletin@gmail.com', subject, html, recipients);

        await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
        console.log('✅ Update email sent successfully!');

    } catch (error) {
        console.error('Error:', error);
    }
}

function generateCustomHtml(articles) {
    const featured = articles[0];
    const others = articles.slice(1, 40);

    const imagePath = path.join(__dirname, '../public/img/email-header.png');
    let imageHtml = '';
    if (fs.existsSync(imagePath)) {
        const imageBase64 = fs.readFileSync(imagePath).toString('base64');
        imageHtml = `<img src="data:image/png;base64,${imageBase64}" alt="Header" style="width: 100%; border-radius: 8px;" />`;
    }

    let html = `
    <html>
    <head>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f7f6; }
            .container { background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 3px solid #005f73; padding-bottom: 20px; margin-bottom: 30px; }
            .featured { background-color: #e9f5f8; border-left: 5px solid #005f73; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0; }
            .featured h2 { margin-top: 0; color: #005f73; font-size: 24px; }
            .featured-meta { font-size: 14px; color: #666; font-style: italic; margin-bottom: 15px; }
            .article { margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
            .article h3 { margin: 0 0 10px 0; font-size: 18px; color: #2a9d8f; }
            .article a { text-decoration: none; color: inherit; }
            .meta { font-size: 12px; color: #888; margin-bottom: 5px; }
            .summary { font-size: 14px; color: #555; }
            .footer { text-align: center; font-size: 12px; color: #999; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; }
            .badge { display: inline-block; padding: 4px 12px; background-color: #005f73; color: white; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                ${imageHtml}
                <h1 style="color: #005f73; margin-top: 20px;">ACTUALIZACIÓN DE NOTICIAS</h1>
                <p>Pesca en Chile - ${new Date().toLocaleDateString('es-CL')}</p>
            </div>

            <div class="featured">
                <span class="badge">Noticia Destacada</span>
                <h2><a href="${featured.url}" style="text-decoration: none; color: inherit;">${featured.title}</a></h2>
                <div class="featured-meta">${featured.source} | ${new Date(featured.date).toLocaleDateString('es-CL')}</div>
                <div class="summary" style="font-size: 16px; font-weight: 500;">${featured.summary}</div>
                <p style="margin-top: 15px;"><a href="${featured.url}" style="color: #005f73; font-weight: bold;">Leer noticia completa &rarr;</a></p>
            </div>

            <h2 style="color: #264653; border-bottom: 2px solid #2a9d8f; padding-bottom: 5px; margin-bottom: 20px;">Otras Noticias Recientes</h2>
    `;

    others.forEach(art => {
        html += `
        <div class="article">
            <h3><a href="${art.url}">${art.title}</a></h3>
            <div class="meta">${art.source} | ${new Date(art.date).toLocaleDateString('es-CL')}</div>
            <div class="summary">${art.summary || ''}</div>
        </div>`;
    });

    html += `
            <div class="footer">
                Este es un boletín de actualización de <strong>Clipping Pesca</strong>.<br>
                <a href="https://clipping-app-production.up.railway.app" style="color: #005f73;">Ver Dashboard Online</a>
            </div>
        </div>
    </body>
    </html>
    `;
    return html;
}

main();
