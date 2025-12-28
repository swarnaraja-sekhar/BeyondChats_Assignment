const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  // Original article data (from scraping)
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    trim: true
  },
  author: {
    type: String,
    trim: true
  },
  publishedDate: {
    type: Date
  },
  sourceUrl: {
    type: String,
    required: true,
    unique: true
  },
  imageUrl: {
    type: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Enhanced article data (from LLM processing)
  enhancedContent: {
    type: String,
    default: null
  },
  enhancedTitle: {
    type: String,
    default: null
  },
  
  // Reference articles used for enhancement
  references: [{
    title: String,
    url: String,
    source: String
  }],
  
  // Status tracking
  isEnhanced: {
    type: Boolean,
    default: false
  },
  enhancedAt: {
    type: Date,
    default: null
  },
  
  // Metadata
  scrapedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
articleSchema.index({ sourceUrl: 1 });
articleSchema.index({ isEnhanced: 1 });
articleSchema.index({ createdAt: -1 });

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
