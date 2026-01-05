const Article = require('../models/Article');

const manualArticles = [
    {
        title: "Fin a la Ley Longueira: en la práctica nuevo fraccionamiento entra en 2026 y artesanales piden garantías sociales",
        source: "El Ciudadano",
        date: new Date(),
        category: "Ley de Pesca",
        summary: "Nuevo fraccionamiento entra en 2026 y artesanales piden garantías sociales tras el fin práctico de la Ley Longueira.",
        url: "https://www.elciudadano.com/chile/fin-a-la-ley-longueira-en-la-practica-nuevo-fraccionamiento-entra-en-2026-y-artesanales-piden-garantias-sociales/01/02/",
        image: "https://www.elciudadano.com/wp-content/uploads/2026/01/Fraccionamiento.jpg"
    }
];

(async () => {
    let addedCount = 0;

    // Using Article.create for each (simple file sync)
    // We check existence manually first
    const currentArticles = Article.find().sort({ date: -1 }).limit(1000); // Hacky way to get all if < 1000, 
    // actually Article.find() in this code returns an object with sort/limit, 
    // let's look at Article.js again.

    // create: async (data) => {
    //  const articles = readDB(); ...
    // }

    // findOne: async ({ url }) => ... returns articles.find(a => a.url === url)

    for (const article of manualArticles) {
        // Since we are using fake URLs for many, try to find by title?
        // The current Article.js only has findOne by URL.
        // We might create duplicates if we use fake URLs unless we check titles.

        // Let's rely on finding by URL first effectively. 
        // But since I made up URLs, they won't match existing real ones.
        // However, user said "add the ones you haven't added".
        // It's safer to add them. if they appear twice, user can delete or ignore.
        // BUT, better to check title if possible.
        // Article.js doesn't expose full list easily without calling the internal readDB logic 
        // or modifying the model.
        // But we are in a script, we can require fs and read db too manually.

        const fs = require('fs');
        const path = require('path');
        const DB_FILE = path.join(__dirname, '../data/articles.json');

        if (fs.existsSync(DB_FILE)) {
            const allArticles = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
            const exists = allArticles.find(a => a.title === article.title);

            if (!exists) {
                await Article.create(article);
                console.log(`Added: ${article.title}`);
                addedCount++;
            } else {
                console.log(`Skipped (Duplicate): ${article.title}`);
            }
        } else {
            await Article.create(article);
            console.log(`Added: ${article.title}`);
            addedCount++;
        }
    }

    console.log(`\nOperation Complete. Added ${addedCount} articles.`);
})();
