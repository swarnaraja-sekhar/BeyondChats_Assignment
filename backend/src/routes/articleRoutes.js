const express = require('express');
const router = express.Router();
const {
  getAllArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  scrapeArticles,
  getPendingArticles,
  enhanceArticle
} = require('../controllers/articleController');

// Scrape route (should be before :id routes)
router.post('/scrape', scrapeArticles);

// Get pending articles for enhancement
router.get('/pending', getPendingArticles);

// CRUD routes
router.route('/')
  .get(getAllArticles)
  .post(createArticle);

// Enhance single article (must be before /:id to avoid being caught)
router.post('/:id/enhance', enhanceArticle);

router.route('/:id')
  .get(getArticle)
  .put(updateArticle)
  .delete(deleteArticle);

module.exports = router;
