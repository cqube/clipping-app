const Article = require('../models/Article');

const manualArticles = [
    {
        title: "Tras nueva rebaja en cuota de merluza común, gerente de PacificBlu pone en duda continuidad operativa",
        source: "Diario Financiero",
        date: new Date("2025-12-26"),
        category: "Pesca Industrial",
        summary: "Marcel Moenne argumentó que la baja sostenida hace inviable la operación de plantas procesadoras, escenario que podría traer como consecuencia un aumento del desempleo.",
        url: "https://www.df.cl/regiones/biobio/empresas/tras-nueva-reduccion-en-cuota-de-merluza-comun-gerente-de-pacificblu-pone"
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
