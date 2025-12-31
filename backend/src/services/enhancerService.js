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
  console.log('[Enhancer] Starting in-process enhancer pipeline...');
  try {
    const pending = await Article.find({ isEnhanced: false }).sort({ createdAt: 1 }).limit(MAX_PENDING);
    console.log(`[Enhancer] Found ${pending.length} pending articles to enhance`);
    if (!pending.length) {
      console.log('[Enhancer] No pending articles to enhance.');
      return;
    }

    for (const article of pending) {
      await processArticle(article);
    }

    console.log('[Enhancer] ========================================');
    console.log('[Enhancer] Pipeline completed.');
  } catch (err) {
    console.error('[Enhancer] Pipeline error:', err.message);
  }
}

async function processArticle(article) {
  console.log(`[Enhancer] ========================================`);
  console.log(`[Enhancer] Processing article: "${article.title}"`);
  console.log(`[Enhancer] Article ID: ${article._id}`);

  // 1) Search for references
  let searchResults = [];
  try {
    console.log(`[Enhancer] Step 1: Searching for references...`);
    searchResults = await googleSearch.searchGoogle(article.title);
    console.log(`[Enhancer] Search returned ${searchResults?.length || 0} results`);
  } catch (err) {
    console.error('[Enhancer] Search failed:', err.message);
  }

  // 2) Collect reference contents (mock or scraped)
  console.log(`[Enhancer] Step 2: Collecting reference content...`);
  const references = [];
  for (const result of (searchResults || []).slice(0, MAX_REF_ARTICLES)) {
    console.log(`[Enhancer] Processing reference: ${result.title}`);
    if (result.mockContent) {
      console.log(`[Enhancer] Using mock content for: ${result.title}`);
      references.push({
        title: result.title,
        url: result.link,
        source: 'mock-reference',
        content: result.mockContent
      });
      continue;
    }

    try {
      console.log(`[Enhancer] Scraping: ${result.link}`);
      const content = await referenceScraper.scrapeArticle(result.link);
      if (content && content.length > 100) {
        console.log(`[Enhancer] Scraped ${content.length} chars from ${result.link}`);
        references.push({
          title: result.title,
          url: result.link,
          source: new URL(result.link).hostname,
          content
        });
      } else {
        console.log(`[Enhancer] Content too short (${content?.length || 0} chars), skipping`);
      }
    } catch (err) {
      console.error('[Enhancer] Reference scrape failed:', err.message);
    }
  }

  console.log(`[Enhancer] Collected ${references.length} reference(s)`);

  if (!references.length) {
    console.log('[Enhancer] No references available; skipping enhancement.');
    return;
  }

  // 3) Enhance
  console.log(`[Enhancer] Step 3: Enhancing with LLM...`);
  let enhancedContent;
  try {
    enhancedContent = await llm.enhanceArticle(article.title, article.content, references);
    console.log(`[Enhancer] LLM returned ${enhancedContent?.length || 0} chars`);
  } catch (err) {
    console.error('[Enhancer] LLM enhancement failed:', err.message);
    return;
  }

  if (!enhancedContent) {
    console.log('[Enhancer] No enhanced content produced; skipping.');
    return;
  }

  // 4) Save back to DB
  console.log(`[Enhancer] Step 4: Saving enhanced article...`);
  try {
    article.enhancedContent = enhancedContent;
    article.enhancedTitle = article.title;
    article.references = references.map(r => ({ title: r.title, url: r.url, source: r.source }));
    article.isEnhanced = true;
    article.enhancedAt = new Date();
    await article.save();
    console.log(`[Enhancer] ✓ Article enhanced and saved: "${article.title}"`);
  } catch (err) {
    console.error('[Enhancer] Failed to save enhanced article:', err.message);
  }
}

async function enhanceSingleArticle(articleId) {
  console.log(`[Enhancer] enhanceSingleArticle called for ID: ${articleId}`);
  const article = await Article.findById(articleId);
  if (!article) {
    console.log(`[Enhancer] Article not found: ${articleId}`);
    throw new Error('Article not found');
  }
  if (article.isEnhanced) {
    console.log(`[Enhancer] Article already enhanced: ${articleId}`);
    return article;
  }
  await processArticle(article);
  return Article.findById(articleId);
}

module.exports = {
  runEnhancerInBackground,
  runEnhancerPipeline,
  enhanceSingleArticle
};
