const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Scrape article content from a given URL; skips mock:// URLs.
 */
async function scrapeArticle(url) {
  if (url.startsWith('mock://')) return null;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);

    const html = await page.content();
    const $ = cheerio.load(html);

    $('script, style, nav, header, footer, aside, .sidebar, .comments, .advertisement, .ad, .social-share, .related-posts').remove();

    const selectors = [
      'article',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.blog-content',
      '.content',
      'main',
      '.prose',
      '[itemprop="articleBody"]'
    ];

    let content = '';
    for (const selector of selectors) {
      const el = $(selector);
      if (el.length > 0) {
        content = el.text().trim();
        if (content.length > 200) break;
      }
    }

    if (content.length < 200) {
      content = $('body').text().trim();
    }

    return cleanText(content);
  } catch (error) {
    console.error(`Scraping error for ${url}:`, error.message);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}

function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/\t/g, ' ')
    .trim()
    .substring(0, 5000);
}

module.exports = { scrapeArticle };
