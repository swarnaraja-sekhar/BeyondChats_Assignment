const Article = require('../models/Article');
const googleSearch = require('../enhancer/googleSearch');
const referenceScraper = require('../enhancer/scraper');
const llm = require('../enhancer/llm');

const MAX_REF_ARTICLES = 2;
const MAX_PENDING = 5;

async function runEnhancerInBackground() {
  if (process.env.ENHANCER_AUTO === 'false') {
    console.log('Enhancer auto-run disabled (ENHANCER_AUTO=false).');
    return;
  }

  // Fire and forget
  process.nextTick(runEnhancerPipeline);
}

async function runEnhancerPipeline() {
  console.log('Starting in-process enhancer pipeline...');
  try {
    const pending = await Article.find({ isEnhanced: false }).sort({ createdAt: 1 }).limit(MAX_PENDING);
    if (!pending.length) {
      console.log('No pending articles to enhance.');
      return;
    }

    for (const article of pending) {
      await processArticle(article);
    }

    console.log('Enhancer pipeline completed.');
  } catch (err) {
    console.error('Enhancer pipeline error:', err.message);
  }
}

async function processArticle(article) {
  console.log(`Enhancing article: ${article.title}`);

  // 1) Search for references
  let searchResults = [];
  try {
    searchResults = await googleSearch.searchGoogle(article.title);
  } catch (err) {
    console.error('Search failed:', err.message);
  }

  // 2) Collect reference contents (mock or scraped)
  const references = [];
  for (const result of (searchResults || []).slice(0, MAX_REF_ARTICLES)) {
    if (result.mockContent) {
      references.push({
        title: result.title,
        url: result.link,
        source: 'mock-reference',
        content: result.mockContent
      });
      continue;
    }

    try {
      const content = await referenceScraper.scrapeArticle(result.link);
      if (content && content.length > 100) {
        references.push({
          title: result.title,
          url: result.link,
          source: new URL(result.link).hostname,
          content
        });
      }
    } catch (err) {
      console.error('Reference scrape failed:', err.message);
    }
  }

  if (!references.length) {
    console.log('No references available; skipping enhancement.');
    return;
  }

  // 3) Enhance
  let enhancedContent;
  try {
    enhancedContent = await llm.enhanceArticle(article.title, article.content, references);
  } catch (err) {
    console.error('LLM enhancement failed:', err.message);
    return;
  }

  if (!enhancedContent) {
    console.log('No enhanced content produced; skipping.');
    return;
  }

  // 4) Save back to DB
  try {
    article.enhancedContent = enhancedContent;
    article.enhancedTitle = article.title;
    article.references = references.map(r => ({ title: r.title, url: r.url, source: r.source }));
    article.isEnhanced = true;
    article.enhancedAt = new Date();
    await article.save();
    console.log('Article enhanced and saved.');
  } catch (err) {
    console.error('Failed to save enhanced article:', err.message);
  }
}

async function enhanceSingleArticle(articleId) {
  const article = await Article.findById(articleId);
  if (!article) throw new Error('Article not found');
  if (article.isEnhanced) return article;
  await processArticle(article);
  return Article.findById(articleId);
}

module.exports = {
  runEnhancerInBackground,
  runEnhancerPipeline,
  enhanceSingleArticle
};
