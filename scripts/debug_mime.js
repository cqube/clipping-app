const subject = '🐟NOTICIAS DE PESCA🇨🇱 - Ene 29, 2026';
const encoded = Buffer.from(subject).toString('base64');
const header = `Subject: =?utf-8?B?${encoded}?=`;

console.log('Original Subject:', subject);
console.log('Encoded Base64:', encoded);
console.log('MIME Header:', header);

// Decode back to verify
const decoded = Buffer.from(encoded, 'base64').toString('utf8');
console.log('Decoded back:', decoded);
