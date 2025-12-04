const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../data/articles.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DB_FILE))) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
}

// Ensure file exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

const readDB = () => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const writeDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

const Article = {
  find: () => {
    const articles = readDB();
    // Return an object with sort/limit methods to mimic Mongoose chain
    return {
      sort: ({ date }) => {
        const sorted = [...articles].sort((a, b) => {
          return date === -1 ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date);
        });
        return {
          limit: (n) => sorted.slice(0, n)
        };
      }
    };
  },

  findOne: async ({ url }) => {
    const articles = readDB();
    return articles.find(a => a.url === url);
  },

  create: async (data) => {
    const articles = readDB();
    const newArticle = { ...data, _id: Date.now().toString() };
    articles.push(newArticle);
    writeDB(articles);
    return newArticle;
  }
};

module.exports = Article;
