const Article = require('../models/Article');
const scraperService = require('../services/scraperService');
const enhancerService = require('../services/enhancerService');

// @desc    Get all articles
// @route   GET /api/articles
// @access  Public
exports.getAllArticles = async (req, res) => {
  try {
    const { enhanced, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (enhanced === 'true') {
      query.isEnhanced = true;
    } else if (enhanced === 'false') {
      query.isEnhanced = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Article.countDocuments(query);

    res.status(200).json({
      success: true,
      count: articles.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
};

// @desc    Get single article
// @route   GET /api/articles/:id
// @access  Public
exports.getArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    res.status(200).json({
      success: true,
      data: article
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
};

// @desc    Create new article
// @route   POST /api/articles
// @access  Public
exports.createArticle = async (req, res) => {
  try {
    const article = await Article.create(req.body);

    res.status(201).json({
      success: true,
      data: article
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Article with this source URL already exists'
      });
    }
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: error.message
    });
  }
};

// @desc    Update article
// @route   PUT /api/articles/:id
// @access  Public
exports.updateArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    res.status(200).json({
      success: true,
      data: article
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: error.message
    });
  }
};

// @desc    Delete article
// @route   DELETE /api/articles/:id
// @access  Public
exports.deleteArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {},
      message: 'Article deleted successfully'
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Article not found'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
};

// @desc    Scrape articles from BeyondChats
// @route   POST /api/scrape
// @access  Public
exports.scrapeArticles = async (req, res) => {
  const { count = 5 } = req.body;
  
  // Respond immediately to prevent timeout
  res.status(202).json({
    success: true,
    message: `Scraping ${count} articles in background. Check /api/articles endpoint for results.`
  });

  // Run scraping in background
  try {
    console.log(`Starting to scrape ${count} articles...`);
    const scrapedArticles = await scraperService.scrapeArticles(parseInt(count));

    if (scrapedArticles.length === 0) {
      console.log('No articles found to scrape');
      return;
    }

    // Save articles to database
    let savedCount = 0;

    for (const articleData of scrapedArticles) {
      try {
        // Check if article already exists
        const existing = await Article.findOne({ sourceUrl: articleData.sourceUrl });
        
        if (existing) {
          console.log(`Article already exists: ${articleData.sourceUrl}`);
        } else {
          const article = await Article.create(articleData);
          savedCount++;
          console.log(`Saved article: ${article.title}`);
        }
      } catch (error) {
        console.error(`Error saving article:`, error.message);
      }
    }

    console.log(`Scraping complete. Saved ${savedCount} new articles.`);

    // Kick off enhancement pipeline in background (in-process)
    try {
      enhancerService.runEnhancerInBackground();
    } catch (err) {
      console.error('Failed to start enhancer:', err.message);
    }
  } catch (error) {
    console.error('Scrape error:', error);
  }
};

// @desc    Enhance all pending articles
// @route   POST /api/articles/enhance-all
// @access  Public
exports.enhanceAllArticles = async (req, res) => {
  // Respond immediately
  res.status(202).json({
    success: true,
    message: 'Enhancement started for all pending articles.'
  });

  // Run enhancement in background
  try {
    await enhancerService.runEnhancerPipeline();
    console.log('Enhance all completed');
  } catch (err) {
    console.error('Enhance all failed:', err.message);
  }
};

// @desc    Enhance a single article by ID
// @route   POST /api/articles/:id/enhance
// @access  Public
exports.enhanceArticle = async (req, res) => {
  const articleId = req.params.id;

  // Validate article exists
  try {
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }
    if (article.isEnhanced) {
      return res.status(200).json({ success: true, message: 'Already enhanced', data: article });
    }
  } catch (err) {
    return res.status(400).json({ success: false, error: 'Invalid article ID' });
  }

  // Respond immediately
  res.status(202).json({
    success: true,
    message: 'Enhancement started. Poll the article for updates.'
  });

  // Run enhancement in background
  try {
    await enhancerService.enhanceSingleArticle(articleId);
    console.log(`Enhancement complete for article ${articleId}`);
  } catch (err) {
    console.error(`Enhancement failed for article ${articleId}:`, err.message);
  }
};

// @desc    Get articles that need enhancement
// @route   GET /api/articles/pending
// @access  Public
exports.getPendingArticles = async (req, res) => {
  try {
    const articles = await Article.find({ isEnhanced: false })
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: articles.length,
      data: articles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
};
