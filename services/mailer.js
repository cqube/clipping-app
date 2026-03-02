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

// Helper: Create Raw Email String (Multipart MIME for better deliverability)
const createRawEmail = (to, subject, htmlBody, bcc = []) => {
    const from = process.env.GMAIL_USER_EMAIL || 'pescaboletin@gmail.com';
    const fromName = "Clipping de Prensa";

    // Create a simple plain text version by removing HTML tags
    const textBody = htmlBody
        .replace(/<style([\s\S]*?)<\/style>/gi, '')
        .replace(/<[^>]+>/g, '\n')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();

    const boundary = "__clipping_app_boundary__";

    // Construct MIME message
    const messageParts = [
        `From: "${fromName}" <${from}>`,
        `To: ${to}`,
        `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        'Precedence: bulk',
        'X-Auto-Response-Suppress: All',
        'Auto-Submitted: auto-generated',
    ];

    if (bcc && bcc.length > 0) {
        messageParts.push(`Bcc: ${bcc.join(', ')}`);
    }

    const encodedHtmlBody = Buffer.from(htmlBody).toString('base64').match(/.{1,76}/g).join('\r\n');

    messageParts.push(
        '',
        `--${boundary}`,
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        textBody,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        '',
        encodedHtmlBody,
        '',
        `--${boundary}--`
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
    // PRIORITY_SOURCES (consistent with index.js and requested rankings)
    const PRIORITY_SOURCES = [
        'La Tercera',
        'El Mercurio',
        'Chilevision',
        'El Mostrador',
        'MEGA',
        'La Cuarta',
        'Tvn Chile',
        'Meganoticias',
        'La Nación',
        'Las Últimas Noticias',
        'La Segunda',
        'BioBioChile',
        'ADN Radio'
    ];

    // Smarter Sorting: By Day (Newest first), then by PRIORITY_SOURCES, then by exact Date
    articles.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        // Group by Day (normalized to YYYY-MM-DD)
        const dayA = dateA.toISOString().split('T')[0];
        const dayB = dateB.toISOString().split('T')[0];

        if (dayA !== dayB) {
            // Sort by full date object descending to handle different days
            return dateB - dateA;
        }

        // Within the same day, check priority
        const indexA = PRIORITY_SOURCES.findIndex(s => a.source.includes(s));
        const indexB = PRIORITY_SOURCES.findIndex(s => b.source.includes(s));

        if (indexA !== -1 && indexB !== -1) {
            if (indexA !== indexB) return indexA - indexB; // Lower index = higher priority
        } else if (indexA !== -1) {
            return -1;
        } else if (indexB !== -1) {
            return 1;
        }

        // If same priority (or neither), sort by exact time within the day
        return dateB - dateA;
    });

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
        'Autoridades y Gabinete',
        'Sector Pesquero',
        'Cultivos y Áreas de Manejo',
        'Pais y Sector Empresarial',
        'Salmoneras',
        'Innovación Acuícola',
        'Economía',
        'Ciencia y Tecnología',
        'Otros'
    ];

    const imagePath = path.join(__dirname, '../public/img/email-header.png');
    let imageHtml = '';
    if (fs.existsSync(imagePath)) {
        const imageBase64 = fs.readFileSync(imagePath).toString('base64');
        imageHtml = `<img src="data:image/png;base64,${imageBase64}" alt="Noticias Pesca" style="width: 100%; max-width: 600px; height: auto; margin: 0 auto 20px auto; display: block;" />`;
    }

    let html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; color: #333; background-color: #f4f4f4; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .content-padding { padding: 20px; }
            h1 { color: #005f73; border-bottom: 2px solid #005f73; padding-bottom: 10px; text-align: center; font-size: 24px; margin-top: 0; }
            h3 { background-color: #e9c46a; padding: 10px; border-radius: 5px; color: #264653; margin-top: 30px; margin-bottom: 15px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; }
            
            /* Responsive Grid */
            .article-grid { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 20px; }
            .article-card { width: 180px; vertical-align: top; padding: 10px; box-sizing: border-box; }
            .card-inner { background-color: #ffffff; padding: 15px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border: 1px solid #eee; height: 100%; }
            
            .article-title { font-size: 15px; font-weight: bold; margin-bottom: 10px; line-height: 1.3; height: 60px; overflow: hidden; }
            .article-title a { text-decoration: none; color: #2a9d8f; }
            .article-meta { font-size: 10px; color: #888; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .article-summary { font-size: 12px; color: #555; line-height: 1.4; height: 85px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; }

            .footer { margin-top: 40px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 20px; padding-bottom: 20px; }
            .btn-cta { display: inline-block; padding: 12px 24px; background-color: #e76f51; color: #ffffff !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; font-size: 14px; }
            .center { text-align: center; }

            @media only screen and (max-width: 600px) {
                .article-card { width: 100% !important; display: block !important; padding: 10px 0 !important; }
                .article-title { height: auto !important; }
                .article-summary { height: auto !important; -webkit-line-clamp: none !important; }
                header { padding: 10px !important; }
                h1 { font-size: 20px !important; }
                .container { width: 100% !important; }
            }
        </style>
    </head>
    <body>
        <center>
        <div class="container">
            <div class="content-padding">
                ${imageHtml}
                <h1>Noticias de Pesca y Acuicultura</h1>
                <p style="text-align: center; color: #666; font-size: 14px;">Resumen diario - ${new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <div class="center">
                    <a href="${APP_URL}" class="btn-cta">Ver Dashboard Completo</a>
                </div>
    `;

    ORDERED_CATEGORIES.forEach(cat => {
        const catArticles = grouped[cat];
        if (catArticles && catArticles.length > 0) {
            html += `<h3>${cat}</h3>`;

            // Start Flex-like Table Container
            html += '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td>';
            html += '<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">';

            // Loop through articles in chunks of 3 for desktop
            for (let i = 0; i < catArticles.length; i += 3) {
                html += '<tr>';
                for (let j = 0; j < 3; j++) {
                    const art = catArticles[i + j];
                    if (art) {
                        const dateStr = new Date(art.date).toLocaleDateString('es-CL');
                        const isManualImage = art.url.startsWith('/img/manual/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(art.url);
                        let finalUrl = art.url;
                        if (finalUrl.startsWith('/')) finalUrl = `${APP_URL}${finalUrl}`;

                        html += `
                        <td class="article-card">
                            <div class="card-inner">
                                <div class="article-title">
                                    <a href="${finalUrl}">${art.title}</a>
                                </div>
                                <div class="article-meta">
                                    ${art.source} | ${dateStr}
                                </div>
                                <div class="article-summary">
                                    ${art.summary || 'Sin resumen disponible.'}
                                </div>
                            </div>
                        </td>`;
                    } else {
                        // Spacer for desktop
                        html += '<td class="article-card" style="padding:0;"></td>';
                    }
                }
                html += '</tr>';
            }
            html += '</table></td></tr></table>';
        }
    });

    html += `
                <div class="footer">
                    <p>Este reporte ha sido generado automáticamente por <strong>Clipping App</strong>.</p>
                    <p><a href="${APP_URL}" style="color: #2a9d8f;">Gestione sus suscripciones aquí</a></p>
                </div>
            </div>
        </div>
        </center>
    </body>
    </html>
    `;

    return html;
};

const sendDailyClipping = async (clientId = 'pesca', customSubject = null) => {
    console.log(`Preparing daily clipping email for ${clientId} (Gmail API)...`);

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
        const articles = await Article.find({ clientId }).sort({ date: -1 }).limit(300);
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

        const subject = customSubject || `NOTICIAS DE PESCA - ${formattedDate}`;

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
        throw error; // Rethrow to allow API to report the error
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
