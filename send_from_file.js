require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const RECIPIENTS_FILE = path.join(__dirname, 'data/recipients.json');
const ARTICLES_FILE = path.join(__dirname, 'data/latest_articles.json');

const getGmailClient = () => {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET
    );
    oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
    return oAuth2Client;
};

const encodeBase64 = (str) => Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function send() {
    console.log('📬 Iniciando envío de correo desde archivo...');

    if (!fs.existsSync(ARTICLES_FILE)) {
        console.error('❌ No se encontró el archivo de artículos:', ARTICLES_FILE);
        return;
    }

    const articles = JSON.parse(fs.readFileSync(ARTICLES_FILE, 'utf8'));
    console.log(`Cargados ${articles.length} artículos del archivo.`);

    if (articles.length === 0) {
        console.log('⚠️ No hay artículos para enviar.');
        return;
    }

    // Sort by date descending
    articles.sort((a, b) => new Date(b.date) - new Date(a.date));

    const recipients = JSON.parse(fs.readFileSync(RECIPIENTS_FILE, 'utf8'));

    // Group by category and limit to 30
    const grouped = {};
    const ORDERED_CATS = ['Pesca Artesanal', 'Pesca Industrial', 'Ley de Pesca', 'Sector Pesquero', 'Cultivos y Áreas de Manejo', 'Salmoneras', 'Otros'];

    articles.forEach(a => {
        const cat = a.category || 'Otros';
        if (!grouped[cat]) grouped[cat] = [];
        if (grouped[cat].length < 6) {
            grouped[cat].push(a);
        }
    });

    let totalToSend = 0;
    Object.values(grouped).forEach(list => totalToSend += list.length);
    console.log(`Total de artículos a enviar (limitado a 6 por categoría): ${totalToSend}`);

    let html = `<html><head><style>
        body{font-family:Arial,sans-serif;max-width:800px;margin:auto;padding:20px;color:#333}
        h1{color:#005f73;border-bottom:2px solid #005f73;padding-bottom:10px}
        h3{background:#e9c46a;padding:10px;border-radius:5px;color:#264653;margin-top:20px}
        .article{margin-bottom:15px;border-bottom:1px solid #ddd;padding-bottom:10px}
        .article h4{margin:0 0 5px 0;font-size:16px}
        .article a{text-decoration:none;color:#2a9d8f}
        .meta{font-size:12px;color:#666}
        .footer{margin-top:30px;font-size:12px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:10px}
    </style></head><body>`;

    const imagePath = path.join(__dirname, 'public/img/email-header.png');
    let imageHtml = '';
    if (fs.existsSync(imagePath)) {
        const imageBase64 = fs.readFileSync(imagePath).toString('base64');
        imageHtml = `<img src="data:image/png;base64,${imageBase64}" alt="Noticias Pesca" style="width: 100%; max-width: 800px; height: auto; margin-bottom: 20px; display: block;" />`;
    }

    html += imageHtml;
    html += `<h1>Clipping de Prensa: Pesca en Chile</h1>`;
    html += `<p>Resumen de noticias - ${new Date().toLocaleDateString('es-CL')}</p>`;

    ORDERED_CATS.forEach(cat => {
        const catArticles = grouped[cat];
        if (catArticles && catArticles.length > 0) {
            html += `<h3>${cat} (${catArticles.length})</h3>`;
            catArticles.forEach(a => {
                const dateStr = new Date(a.date).toLocaleDateString('es-CL');
                html += `<div class="article">
                    <h4><a href="${a.url}">${a.title}</a></h4>
                    <div class="meta">${a.source} | ${dateStr}</div>
                </div>`;
            });
        }
    });

    html += `<div class="footer">Este es un correo automático generado por Clipping App.</div>`;
    html += `</body></html>`;

    const sender = process.env.GMAIL_USER_EMAIL || 'pescaboletin@gmail.com';
    const subject = `Clipping Pesca - ${new Date().toLocaleDateString('es-CL')}`;

    const messageParts = [
        `From: ${sender}`,
        `To: ${sender}`,
        `Bcc: ${recipients.join(', ')}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
        '',
        html
    ];

    const raw = encodeBase64(messageParts.join('\n'));
    const gmail = google.gmail({ version: 'v1', auth: getGmailClient() });

    const res = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
    console.log(`✅ Email enviado a ${recipients.length} destinatarios con ${totalToSend} artículos. ID: ${res.data.id}`);
}

send().catch(console.error);
