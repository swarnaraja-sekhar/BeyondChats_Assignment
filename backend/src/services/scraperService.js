const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

class ScraperService {
  constructor() {
    this.baseUrl = 'https://beyondchats.com/blogs/';
  }

  /**
   * Scrape articles from BeyondChats blog
   * @param {number} count - Number of articles to scrape (default 5)
   * @returns {Promise<Array>} Array of scraped articles
   */
  async scrapeArticles(count = 5) {
    let browser;
    try {
      console.log('Launching browser...');
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Navigate to the blogs page
      console.log('Navigating to blogs page...');
      await page.goto(this.baseUrl, { 
        waitUntil: 'networkidle2',
        timeout: 60000 
      });

      // Wait for blog content to load
      await page.waitForSelector('article, .blog-post, .post, [class*="blog"], [class*="article"]', { timeout: 30000 }).catch(() => {
        console.log('No specific blog selector found, continuing with page content...');
      });

      // Get the last page of blogs (oldest articles)
      const lastPageUrl = await this.getLastPageUrl(page);
      
      if (lastPageUrl && lastPageUrl !== this.baseUrl) {
        console.log(`Navigating to last page: ${lastPageUrl}`);
        await page.goto(lastPageUrl, { 
          waitUntil: 'networkidle2',
          timeout: 60000 
        });
      }

      // Get article links from the page
      const articleLinks = await this.getArticleLinks(page, count);
      console.log(`Found ${articleLinks.length} article links`);

      // Scrape each article
      const articles = [];
      for (const link of articleLinks) {
        try {
          console.log(`Scraping article: ${link}`);
          const article = await this.scrapeArticleContent(page, link);
          if (article) {
            articles.push(article);
          }
        } catch (error) {
          console.error(`Error scraping article ${link}:`, error.message);
        }
      }

      return articles;
    } catch (error) {
      console.error('Scraping error:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Get the URL of the last page (oldest articles)
   */
  async getLastPageUrl(page) {
    try {
      const lastPageUrl = await page.evaluate(() => {
        // Look for pagination links
        const paginationSelectors = [
          '.pagination a:last-child',
          '.page-numbers:last-child',
          'a[href*="page"]:last-of-type',
          '.nav-links a:last-child',
          '[class*="pagination"] a:last-child'
        ];

        for (const selector of paginationSelectors) {
          const link = document.querySelector(selector);
          if (link && link.href) {
            return link.href;
          }
        }

        // Try to find the highest page number
        const pageLinks = document.querySelectorAll('a[href*="page"]');
        let maxPage = 1;
        let maxPageUrl = null;

        pageLinks.forEach(link => {
          const match = link.href.match(/page[\/=](\d+)/);
          if (match) {
            const pageNum = parseInt(match[1]);
            if (pageNum > maxPage) {
              maxPage = pageNum;
              maxPageUrl = link.href;
            }
          }
        });

        return maxPageUrl;
      });

      return lastPageUrl;
    } catch (error) {
      console.log('Could not find pagination, using first page');
      return null;
    }
  }

  /**
   * Get article links from the current page
   */
  async getArticleLinks(page, count) {
    const links = await page.evaluate((maxCount) => {
      const articleSelectors = [
        'article a[href*="/blog"]',
        '.blog-post a',
        '.post a[href]',
        'a[href*="/blogs/"]',
        '.entry-title a',
        'h2 a[href*="blog"]',
        'h3 a[href*="blog"]',
        '[class*="blog"] a[href]',
        '[class*="article"] a[href]',
        '.card a[href]'
      ];

      const foundLinks = new Set();

      for (const selector of articleSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el.href && 
              !el.href.includes('#') && 
              !el.href.includes('category') &&
              !el.href.includes('tag') &&
              !el.href.includes('author') &&
              el.href.includes('blog')) {
            foundLinks.add(el.href);
          }
        });
        if (foundLinks.size >= maxCount) break;
      }

      // If no blog links found, try getting all article-like links
      if (foundLinks.size === 0) {
        const allLinks = document.querySelectorAll('a[href]');
        allLinks.forEach(el => {
          if (el.href && 
              el.href.includes(window.location.hostname) &&
              !el.href.endsWith('/blogs/') &&
              el.href.includes('/blogs/')) {
            foundLinks.add(el.href);
          }
        });
      }

      return Array.from(foundLinks).slice(0, maxCount);
    }, count);

    return links;
  }

  /**
   * Scrape content from a single article page
   */
  async scrapeArticleContent(page, url) {
    try {
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 60000 
      });

      // Wait a bit for dynamic content
      await page.waitForTimeout(2000);

      const articleData = await page.evaluate(() => {
        // Helper to get text content
        const getText = (selector) => {
          const el = document.querySelector(selector);
          return el ? el.textContent.trim() : null;
        };

        // Helper to get attribute
        const getAttr = (selector, attr) => {
          const el = document.querySelector(selector);
          return el ? el.getAttribute(attr) : null;
        };

        // Title selectors
        const titleSelectors = [
          'h1.entry-title',
          'h1.post-title',
          'article h1',
          '.blog-title h1',
          'h1[class*="title"]',
          '.post h1',
          'h1'
        ];

        let title = null;
        for (const selector of titleSelectors) {
          title = getText(selector);
          if (title && title.length > 5) break;
        }

        // Content selectors
        const contentSelectors = [
          '.entry-content',
          '.post-content',
          'article .content',
          '.blog-content',
          '[class*="article-body"]',
          '[class*="post-body"]',
          'article',
          '.prose',
          'main article'
        ];

        let content = null;
        for (const selector of contentSelectors) {
          const el = document.querySelector(selector);
          if (el) {
            // Get HTML content for rich formatting
            content = el.innerHTML;
            break;
          }
        }

        // If no content div found, try to get main content
        if (!content) {
          const main = document.querySelector('main') || document.querySelector('article');
          if (main) {
            content = main.innerHTML;
          }
        }

        // Image
        const imageSelectors = [
          'article img',
          '.featured-image img',
          '.post-thumbnail img',
          '[class*="hero"] img',
          'meta[property="og:image"]'
        ];

        let imageUrl = null;
        for (const selector of imageSelectors) {
          if (selector.includes('meta')) {
            imageUrl = getAttr(selector, 'content');
          } else {
            imageUrl = getAttr(selector, 'src');
          }
          if (imageUrl) break;
        }

        // Author
        const authorSelectors = [
          '.author-name',
          '.post-author',
          '[rel="author"]',
          '.byline',
          '[class*="author"]'
        ];

        let author = null;
        for (const selector of authorSelectors) {
          author = getText(selector);
          if (author) break;
        }

        // Date
        const dateSelectors = [
          'time[datetime]',
          '.post-date',
          '.entry-date',
          '[class*="date"]',
          'meta[property="article:published_time"]'
        ];

        let publishedDate = null;
        for (const selector of dateSelectors) {
          if (selector.includes('meta')) {
            publishedDate = getAttr(selector, 'content');
          } else if (selector.includes('time')) {
            publishedDate = getAttr('time', 'datetime') || getText(selector);
          } else {
            publishedDate = getText(selector);
          }
          if (publishedDate) break;
        }

        // Excerpt from meta
        const excerpt = getAttr('meta[name="description"]', 'content') ||
                       getAttr('meta[property="og:description"]', 'content');

        return {
          title,
          content,
          imageUrl,
          author,
          publishedDate,
          excerpt
        };
      });

      if (!articleData.title || !articleData.content) {
        console.log(`Incomplete article data for ${url}`);
        return null;
      }

      return {
        ...articleData,
        sourceUrl: url,
        scrapedAt: new Date()
      };
    } catch (error) {
      console.error(`Error scraping article content from ${url}:`, error.message);
      return null;
    }
  }
}

module.exports = new ScraperService();
