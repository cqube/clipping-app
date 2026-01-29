const date = new Date();
const monthShort = date.toLocaleString('es-CL', { month: 'short' }).replace('.', '');
const month = monthShort.charAt(0).toUpperCase() + monthShort.slice(1);
const day = date.getDate();
const year = date.getFullYear();
const formattedDate = `${month} ${day}, ${year}`;

const subject = `NOTICIAS DE PESCA - ${formattedDate}`;

console.log('Subject generated:');
console.log(subject);
