const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const Article = require('../models/Article');

const RECIPIENTS_FILE = path.join(__dirname, '../data/recipients.json');
const APP_URL = process.env.APP_URL || process.env.APP_CURL || 'https://clipping-app-production.up.railway.app';

// Gmail API Configuration
const getGmailClient = () => {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error('Missing Gmail API credentials in .env. Please check GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN.');
    }

    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oAuth2Client.setCredentials({ refresh_token: refreshToken });
    return oAuth2Client;
};

// Helper: Encode string to Base64URL
const encodeBase64 = (str) => {
    return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// Helper: Create Raw Email String
const createRawEmail = (to, subject, htmlBody, bcc = []) => {
    const from = process.env.GMAIL_USER_EMAIL || 'pescaboletin@gmail.com';
    const fromName = "Clipping de Prensa";

    // Construct MIME message
    const messageParts = [
        `From: "${fromName}" <${from}>`,
        `To: ${to}`,
    ];

    if (bcc && bcc.length > 0) {
        messageParts.push(`Bcc: ${bcc.join(', ')}`);
    }

    messageParts.push(
        'Content-Type: text/html; charset=UTF-8',
        'MIME-Version: 1.0',
        `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
        '',
        htmlBody
    );

    return encodeBase64(messageParts.join('\r\n'));
};

const sendEmailViaGmail = async (to, subject, htmlBody) => {
    const auth = getGmailClient();
    if (!auth) return false;

    const gmail = google.gmail({ version: 'v1', auth });

    try {
        const raw = createRawEmail(to, subject, htmlBody);
        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw }
        });
        console.log(`Email sent to ${to}. ID: ${res.data.id}`);
        return res.data;
    } catch (error) {
        console.error(`Failed to send email to ${to}:`, error.message);
        throw error;
    }
};

const getRecipients = () => {
    try {
        if (fs.existsSync(RECIPIENTS_FILE)) {
            return JSON.parse(fs.readFileSync(RECIPIENTS_FILE, 'utf8'));
        }
        return [];
    } catch (e) {
        console.error('Error reading recipients:', e);
        return [];
    }
};

const generateHtml = (articles) => {
    // Sort by date descending
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Group by category and limit to 6
    const grouped = {};
    articles.forEach(art => {
        const cat = art.category || 'Otros';
        if (!grouped[cat]) grouped[cat] = [];
        if (grouped[cat].length < 6) {
            grouped[cat].push(art);
        }
    });

    // Priority order (same as frontend)
    const ORDERED_CATEGORIES = [
        'Pesca Artesanal',
        'Pesca Industrial',
        'Ley de Pesca',
        'Sector Pesquero',
        'Cultivos y Áreas de Manejo',
        'Pais y Sector Empresarial',
        'Salmoneras',
        'Innovación Acuícola',
        'Otros'
    ];

    const imagePath = path.join(__dirname, '../public/img/email-header.png');
    let imageHtml = '';
    if (fs.existsSync(imagePath)) {
        const imageBase64 = fs.readFileSync(imagePath).toString('base64');
        imageHtml = `<img src="data:image/png;base64,${imageBase64}" alt="Noticias Pesca" style="width: 100%; max-width: 800px; height: auto; margin-bottom: 20px; display: block;" />`;
    }

    let html = `
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }
            h1 { color: #005f73; border-bottom: 2px solid #005f73; padding-bottom: 10px; }
            h3 { background-color: #e9c46a; padding: 10px; border-radius: 5px; color: #264653; margin-top: 20px;}
            .article { margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            .article h2 { margin: 0 0 5px 0; font-size: 18px; }
            .article a { text-decoration: none; color: #2a9d8f; }
            .meta { font-size: 12px; color: #666; margin-bottom: 5px; }
            .summary { font-size: 14px; line-height: 1.4; }
            .footer { margin-top: 30px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 10px;}
            .btn-cta { display: inline-block; padding: 12px 24px; background-color: #005f73; color: #ffffff !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .center { text-align: center; }
        </style>
    </head>
    <body>
        ${imageHtml}
        <h1>Clipping de Prensa: Pesca en Chile</h1>
        <p>Resumen diario de noticias - ${new Date().toLocaleDateString('es-CL')}</p>
        <div class="center">
            <a href="${APP_URL}" class="btn-cta">Ver Dashboard Online</a>
        </div>
    `;

    ORDERED_CATEGORIES.forEach(cat => {
        const catArticles = grouped[cat];
        if (catArticles && catArticles.length > 0) {
            html += `<h3>${cat} (${catArticles.length})</h3>`;
            catArticles.forEach(art => {
                const dateStr = new Date(art.date).toLocaleDateString('es-CL');
                html += `
                <div class="article">
                    <h2><a href="${art.url}">${art.title}</a></h2>
                    <div class="meta">${art.source} | ${dateStr}</div>
                    <div class="summary">${art.summary || ''}</div>
                </div>`;
            });
        }
    });

    html += `
        <div class="footer">
            Este es un correo automático generado por <a href="${APP_URL}">Clipping App</a>.
        </div>
    </body>
    </html>
    `;

    return html;
};

const sendDailyClipping = async () => {
    console.log('Preparing daily clipping email (Gmail API)...');

    // 1. Get recipients
    const recipients = getRecipients();
    if (recipients.length === 0) {
        console.log('No recipients found. Skipping email.');
        return;
    }

    // 2. Get articles from the last 4 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 4);

    try {
        const articles = await Article.find().sort({ date: -1 }).limit(300);
        let articlesToSend = articles.filter(a => new Date(a.date) > cutoff);

        if (process.env.FORCE_SEND_EMAIL === 'true' && articlesToSend.length === 0) {
            console.log('No recent articles found, but FORCE_SEND_EMAIL is true. Sending latest 20 articles.');
            articlesToSend = articles.slice(0, 20);
        }

        if (articlesToSend.length === 0) {
            console.log('No recent articles to send (last 24h).');
            return;
        }

        const html = generateHtml(articlesToSend);

        // New subject format (Spanish): 🐟NOTICIAS DE PESCA🇨🇱 - Ene 27, 2026
        const date = new Date();
        const monthShort = date.toLocaleString('es-CL', { month: 'short' }).replace('.', '');
        const month = monthShort.charAt(0).toUpperCase() + monthShort.slice(1);
        const day = date.getDate();
        const year = date.getFullYear();
        const formattedDate = `${month} ${day}, ${year}`;

        const subject = `NOTICIAS DE PESCA - ${formattedDate}`;

        // --- OPTIMIZED SENDING ---
        console.log(`Preparing to send to ${recipients.length} recipients...`);
        console.time('send-daily-clipping'); // Start timer

        const auth = getGmailClient();
        const gmail = google.gmail({ version: 'v1', auth });
        const sender = process.env.GMAIL_USER_EMAIL || 'pescaboletin@gmail.com';

        // Use the consolidated createRawEmail helper
        const raw = createRawEmail(sender, subject, html, recipients);

        await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw }
        });

        console.log(`Clipping sent successfully to ${recipients.length} recipients.`);
        console.timeEnd('send-daily-clipping'); // End timer
        // --- END OPTIMIZED SENDING ---

    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const sendConfirmationEmail = async (email) => {
    console.log(`Sending confirmation email to ${email}...`);

    const html = `
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; }
            h1 { color: #005f73; }
            .content { line-height: 1.6; }
            .footer { margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px;}
        </style>
    </head>
    <body>
        <h1>¡Bienvenido a Clipping Pesca!</h1>
        <div class="content">
            <p>Hola,</p>
            <p>Gracias por suscribirte a nuestro clipping de noticias sobre pesca en Chile.</p>
            <p>A partir de mañana, recibirás diariamente un resumen con las noticias más relevantes de la industria, pesca artesanal y normativa.</p>
            <p>Puedes ver el dashboard en tiempo real aquí: <a href="${APP_URL}">${APP_URL}</a></p>
        </div>
        <div class="footer">
            Si no te suscribiste a este servicio, por favor ignora este correo.
        </div>
    </body>
    </html>
    `;

    try {
        await sendEmailViaGmail(email, 'Confirmación de suscripción - Clipping Pesca', html);
        return true;
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        return false;
    }
};

module.exports = { sendDailyClipping, sendConfirmationEmail, sendEmailViaGmail, generateHtml };
