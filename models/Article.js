const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    url: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    source: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    category: {
        type: String,
        default: 'Otros'
    },
    summary: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        trim: true
    },
    clientId: {
        type: String,
        required: true,
        default: 'pesca', // Backwards compatibility / default
        index: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt
});

// Index for efficient sorting and querying
articleSchema.index({ date: -1 });
// articleSchema.index({ url: 1 }); // Removed duplicate (already unique: true)

module.exports = mongoose.model('Article', articleSchema);
