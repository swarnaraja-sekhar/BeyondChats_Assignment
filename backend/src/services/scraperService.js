const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');

class ScraperService {
  constructor() {
    this.baseUrl = 'https://beyondchats.com/blogs/';
  }

  /**
   * Main scraping function - uses Puppeteer for JS-rendered Elementor content
   */
  async scrapeArticles(count = 5) {
    console.log('Starting to scrape BeyondChats blog articles...');
    
    try {
      return await this.scrapeWithPuppeteer(count);
    } catch (error) {
      console.error('Puppeteer scraping failed:', error.message);
      console.log('Trying axios fallback...');
      return await this.scrapeWithAxios(count);
    }
  }

  /**
   * Primary method: Puppeteer for JavaScript-rendered content
   */
  async scrapeWithPuppeteer(count) {
    let browser;
    try {
      console.log('Launching browser...');
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      page.setDefaultTimeout(20000);

      // Navigate to blog listing
      console.log('Navigating to blogs page...');
      await page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 20000 });
      await this.sleep(1200);

      // Get article links and filter out search/tag/category pages
      const articleLinks = await page.evaluate(() => {
        const links = [];

        const isArticleUrl = (href) => {
          try {
            const url = new URL(href, 'https://beyondchats.com');
            const segments = url.pathname.split('/').filter(Boolean);
            const slug = segments[segments.length - 1] || '';

            // reject tag/category/search-like pages
            if (segments.includes('tag') || segments.includes('category') || segments.includes('search')) return false;

            return url.hostname.includes('beyondchats.com') &&
              url.pathname.startsWith('/blogs/') &&
              segments.length >= 2 &&
              !url.search &&
              !url.hash &&
              slug.includes('-') &&
              slug.length > 4;
          } catch (e) {
            return false;
          }
        };

        document.querySelectorAll('a[href]').forEach(a => {
          const href = a.href;
          if (href && isArticleUrl(href) && !links.includes(href)) {
            links.push(href);
          }
        });

        return links;
      });

      console.log(`Found ${articleLinks.length} article links`);
      const linksToScrape = articleLinks.slice(0, count);
      
      const articles = [];
      const concurrency = 2;
      const queue = [...linksToScrape];
      const running = [];

      const worker = async (link) => {
        const articlePage = await browser.newPage();
        articlePage.setDefaultTimeout(20000);
        await articlePage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        try {
          console.log(`\nScraping: ${link}`);
          const article = await this.scrapeArticlePage(articlePage, link);
          if (article && article.content) {
            articles.push(article);
            console.log(`  ✓ Got "${article.title}" (${article.content.length} chars)`);
          } else {
            console.log('  ✗ Could not extract content');
          }
        } catch (err) {
          console.error(`  ✗ Error: ${err.message}`);
        } finally {
          await articlePage.close();
        }
      };

      while (queue.length > 0 || running.length > 0) {
        while (running.length < concurrency && queue.length > 0) {
          const link = queue.shift();
          const promise = worker(link).then(() => {
            const idx = running.indexOf(promise);
            if (idx > -1) running.splice(idx, 1);
          });
          running.push(promise);
        }
        if (running.length > 0) {
          await Promise.race(running);
        }
      }

      await browser.close();
      console.log(`\nSuccessfully scraped ${articles.length} articles`);
      return articles;
    } catch (error) {
      if (browser) await browser.close();
      throw error;
    }
  }

  /**
   * Scrape a single article page
   */
  async scrapeArticlePage(page, url) {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    await this.sleep(1200);

    const articleData = await page.evaluate(() => {
      // Get title from h1
      const h1 = document.querySelector('h1');
      let title = h1 ? h1.innerText.trim() : '';
      
      // Fallback to meta title
      if (!title) {
        const ogTitle = document.querySelector('meta[property="og:title"]');
        title = ogTitle ? ogTitle.content : '';
      }

      // Get image
      const ogImage = document.querySelector('meta[property="og:image"]');
      const imageUrl = ogImage ? ogImage.content : '';
      
      // Get excerpt/description
      const metaDesc = document.querySelector('meta[name="description"]') || 
                       document.querySelector('meta[property="og:description"]');
      const excerpt = metaDesc ? metaDesc.content : '';

      // BeyondChats uses Elementor - find content in Elementor widgets
      // Look for the main text content widgets
      const contentSelectors = [
        '.elementor-widget-theme-post-content',
        '.elementor-widget-text-editor',
        '[data-widget_type="theme-post-content.default"]',
        '[data-widget_type="text-editor.default"]',
        '.elementor-text-editor',
        '.entry-content',
        '.post-content',
        'article .elementor-section',
        'article'
      ];
      
      let mainContent = null;
      for (const selector of contentSelectors) {
        const el = document.querySelector(selector);
        if (el && el.innerText.length > 200) {
          mainContent = el;
          break;
        }
      }
      
      // If still no content, get all elementor text widgets
      if (!mainContent) {
        const textWidgets = document.querySelectorAll('.elementor-widget-text-editor');
        if (textWidgets.length > 0) {
          // Create a container with all text widgets
          const container = document.createElement('div');
          textWidgets.forEach(w => container.appendChild(w.cloneNode(true)));
          mainContent = container;
        }
      }
      
      // Final fallback - get body content after the header
      if (!mainContent) {
        mainContent = document.querySelector('main') || document.body;
      }

      // Now extract content from mainContent
      const contentElements = [];
      const seenTexts = new Set();
      
      // Skip patterns
      const skipPatterns = [
        'cookie', 'privacy', 'subscribe', 'newsletter', 'follow us', 
        'share', 'leave a reply', 'related posts', 'login', 'register', 
        'copyright', 'all rights reserved', 'no comments', 'simran jain',
        'beyondchats team', 'november', 'december', 'january', 'february',
        'posted by', 'written by', 'author:', 'category:', 'tags:'
      ];
      
      const isValidParagraph = (text) => {
        if (!text || text.length < 50) return false;
        const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
        if (letterCount < text.length * 0.4) return false;
        const lowerText = text.toLowerCase();
        // Skip if starts with common metadata
        if (/^(by\s|posted|written|author|november|december|january)/i.test(text)) return false;
        if (skipPatterns.some(p => lowerText.includes(p) && text.length < 100)) return false;
        if (text.includes('{') || text.includes('settings') || text.includes('sticky')) return false;
        return true;
      };

      // Get all text content elements within the main content area
      mainContent.querySelectorAll('h2, h3, h4, p, ul, ol, blockquote').forEach(el => {
        const tag = el.tagName.toLowerCase();
        const text = el.innerText.trim();
        
        // Skip if already seen or inside unwanted containers
        if (seenTexts.has(text)) return;
        
        // Check if inside header/footer/sidebar
        const parent = el.closest('header, footer, nav, aside, .sidebar, .related-posts, .elementor-widget-post-info');
        if (parent) return;
        
        if (tag.startsWith('h')) {
          // Headings
          if (text && text.length > 3 && text.length < 200) {
            const letterCount = (text.match(/[a-zA-Z]/g) || []).length;
            const lowerText = text.toLowerCase();
            // Skip navigation headings
            if (letterCount > text.length * 0.5 && 
                !lowerText.includes('related') && 
                !lowerText.includes('comment') &&
                !lowerText.includes('share')) {
              seenTexts.add(text);
              contentElements.push({ tag, text });
            }
          }
        } else if (tag === 'p') {
          if (isValidParagraph(text)) {
            seenTexts.add(text);
            contentElements.push({ tag: 'p', text });
          }
        } else if (tag === 'blockquote') {
          if (text && text.length > 20) {
            seenTexts.add(text);
            contentElements.push({ tag: 'blockquote', text });
          }
        } else if (tag === 'ul' || tag === 'ol') {
          const items = [];
          el.querySelectorAll('li').forEach(li => {
            const liText = li.innerText.trim();
            if (liText && liText.length > 5 && !seenTexts.has(liText)) {
              items.push(liText);
              seenTexts.add(liText);
            }
          });
          if (items.length > 0) {
            contentElements.push({ tag, items });
          }
        }
      });

      // Build HTML preserving structure
      let contentHtml = '';
      contentElements.forEach(el => {
        if (el.tag === 'p') {
          contentHtml += `<p>${el.text}</p>\n`;
        } else if (el.tag === 'blockquote') {
          contentHtml += `<blockquote>${el.text}</blockquote>\n`;
        } else if (el.tag.startsWith('h')) {
          contentHtml += `<${el.tag}>${el.text}</${el.tag}>\n`;
        } else if (el.tag === 'ul' || el.tag === 'ol') {
          contentHtml += `<${el.tag}>\n`;
          el.items.forEach(item => {
            contentHtml += `  <li>${item}</li>\n`;
          });
          contentHtml += `</${el.tag}>\n`;
        }
      });

      // If still no content, use excerpt
      if (!contentHtml && excerpt) {
        contentHtml = `<p>${excerpt}</p>`;
      }

      return {
        title,
        content: contentHtml,
        excerpt,
        imageUrl,
        author: 'BeyondChats Team'
      };
    });

    if (!articleData.title) {
      return null;
    }

    // Skip if extracted content is too short (likely listing/search pages)
    const contentTextLength = (articleData.content || '').replace(/<[^>]+>/g, '').trim().length;
    if (contentTextLength < 500) {
      console.log(`  Skipping "${articleData.title}" (content too short: ${contentTextLength} chars)`);
      return null;
    }

    console.log(`  Got: "${articleData.title}" - ${articleData.content.length} chars`);

    return {
      title: articleData.title.substring(0, 500),
      content: articleData.content || '<p>Content not available.</p>',
      excerpt: (articleData.excerpt || '').substring(0, 500),
      author: articleData.author,
      imageUrl: articleData.imageUrl,
      sourceUrl: url,
      publishedDate: new Date(),
      scrapedAt: new Date()
    };
  }

  /**
   * Fallback: Axios + Cheerio scraping
   */
  async scrapeWithAxios(count) {
    try {
      console.log('Using axios fallback...');
      
      const response = await axios.get(this.baseUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const articleLinks = [];

      const isArticleUrl = (rawHref) => {
        try {
          const fullUrl = rawHref.startsWith('http') ? rawHref : `https://beyondchats.com${rawHref}`;
          const url = new URL(fullUrl);
          const segments = url.pathname.split('/').filter(Boolean);
          const slug = segments[segments.length - 1] || '';

          // reject tag/category/search-like pages
          if (segments.includes('tag') || segments.includes('category') || segments.includes('search')) return false;

          return url.hostname.includes('beyondchats.com') &&
            url.pathname.startsWith('/blogs/') &&
            segments.length >= 2 &&
            !url.search &&
            !url.hash &&
            slug.includes('-') &&
            slug.length > 4;
        } catch (e) {
          return false;
        }
      };

      $('a[href]').each((i, el) => {
        const href = $(el).attr('href');
        if (href && isArticleUrl(href) && !articleLinks.includes(href)) {
          const fullUrl = href.startsWith('http') ? href : `https://beyondchats.com${href}`;
          articleLinks.push(fullUrl);
        }
      });

      console.log(`Found ${articleLinks.length} article links`);
      const linksToScrape = articleLinks.slice(0, count);
      
      const articles = [];
      for (const link of linksToScrape) {
        try {
          console.log(`Scraping: ${link}`);
          const article = await this.scrapeArticleAxios(link);
          if (article) {
            articles.push(article);
            console.log(`  ✓ Got: ${article.title}`);
          }
          await this.sleep(500);
        } catch (err) {
          console.error(`Failed ${link}:`, err.message);
        }
      }

      return articles;
    } catch (error) {
      console.error('Axios fallback failed:', error.message);
      return [];
    }
  }

  async scrapeArticleAxios(url) {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    const $ = cheerio.load(response.data);
    
    // Remove junk
    $('script, style, nav, header, footer, aside, .sidebar').remove();

    const title = $('h1').first().text().trim() ||
                  $('meta[property="og:title"]').attr('content') || '';
    
    const imageUrl = $('meta[property="og:image"]').attr('content') || '';
    const excerpt = $('meta[name="description"]').attr('content') || '';

    // Get paragraphs
    const paragraphs = [];
    $('p').each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 40) {
        paragraphs.push(`<p>${text}</p>`);
      }
    });

    if (!title) return null;

    // Skip if content too short (avoid listing/search pages)
    const contentTextLength = paragraphs.join(' ').replace(/<[^>]+>/g, '').trim().length;
    if (contentTextLength < 500) return null;

    return {
      title,
      content: paragraphs.join('\n') || `<p>${excerpt}</p>`,
      excerpt,
      author: 'BeyondChats Team',
      imageUrl,
      sourceUrl: url,
      publishedDate: new Date(),
      scrapedAt: new Date()
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new ScraperService();
