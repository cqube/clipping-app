const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const Article = require('../models/Article');

// Configure SMTP Transport (Env vars or defaults)
// NOTE: User must provide these env vars for it to work.
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'pescaboletin@gmail.com',
        pass: process.env.SMTP_PASS || 'Pesca2025$$'
    }
});

const RECIPIENTS_FILE = path.join(__dirname, '../data/recipients.json');

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
    // Group by category
    const grouped = {};
    articles.forEach(art => {
        const cat = art.category || 'Otros';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(art);
    });

    // Priority order (same as frontend)
    const ORDERED_CATEGORIES = [
        'Pesca Artesanal',
        'Cultivos y Áreas de Manejo',
        'Ley de Pesca',
        'Sector Pesquero',
        'Pais y Sector Empresarial',
        'Pesca Industrial',
        'Salmoneras',
        'Innovación Acuícola',
        'Otros'
    ];

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
        </style>
    </head>
    <body>
        <h1>Clipping de Prensa: Pesca en Chile</h1>
        <p>Resumen diario de noticias - ${new Date().toLocaleDateString('es-CL')}</p>
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
            Este es un correo automático generado por Clipping App.
        </div>
    </body>
    </html>
    `;

    return html;
};

const sendDailyClipping = async () => {
    console.log('Preparing daily clipping email...');

    // 1. Get recipients
    const recipients = getRecipients();
    if (recipients.length === 0) {
        console.log('No recipients found. Skipping email.');
        return;
    }

    // 2. Get articles from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // We want the most recent ones found today or yesterday. 
    // Actually, usually a daily clipping sends WHAT WAS FOUND TODAY.
    // Let's assume the scraper ran at 8:30. We send at 8:35.
    // So we should pick up articles created (found) today.
    // But `date` field is publication date. We might want `_id` timestamp or checks creation time?
    // Article.js uses `_id` as Date.now().

    // Let's settle for: Articles published in the last 24 hours OR found in the last 24 hours.
    // Since we don't have separate 'foundAt', we'll rely on 'date' (publication date).
    // Most news found today were published today or yesterday.

    try {
        const articles = await Article.find().sort({ date: -1 }).limit(100);
        // Simple filter for now: recent articles. 
        // Ideally strict 24h filter: .filter(a => new Date(a.date) > yesterday)
        // But scraping might pick up older content if new feeds are added.
        // Let's filter by date > yesterday 00:00 to cover "today's clipping"

        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - 24);

        const recentArticles = articles.filter(a => new Date(a.date) > cutoff);

        if (recentArticles.length === 0) {
            console.log('No recent articles to send.');
            // Maybe send an email saying "No news"? Or just skip. Skip for now.
            return;
        }

        const html = generateHtml(recentArticles);

        const mailOptions = {
            from: process.env.SMTP_FROM || '"Clipping Pesca" <noreply@example.com>',
            bcc: recipients.join(', '), // BCC to hide recipient list
            subject: `Clipping Pesca - ${new Date().toLocaleDateString('es-CL')}`,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);

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
        </div>
        <div class="footer">
            Si no te suscribiste a este servicio, por favor ignora este correo.
        </div>
    </body>
    </html>
    `;

    const mailOptions = {
        from: process.env.SMTP_FROM || '"Clipping Pesca" <noreply@example.com>',
        to: email, // Direct to the user
        subject: 'Confirmación de suscripción - Clipping Pesca',
        html: html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        return false;
    }
};

module.exports = { sendDailyClipping, sendConfirmationEmail };
