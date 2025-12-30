const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

/**
 * Scrape article content from a given URL
 * Tries to extract main content from various blog formats
 */
async function scrapeArticle(url) {
    let browser;
    
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // set a realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // go to the page
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // wait a bit for dynamic content
        await page.waitForTimeout(1500);
        
        // get the page content
        const html = await page.content();
        const $ = cheerio.load(html);
        
        // remove unwanted elements
        $('script, style, nav, header, footer, aside, .sidebar, .comments, .advertisement, .ad, .social-share, .related-posts').remove();
        
        // try different selectors to find main content
        const contentSelectors = [
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
        
        for (const selector of contentSelectors) {
            const el = $(selector);
            if (el.length > 0) {
                content = el.text().trim();
                if (content.length > 200) {
                    break; // found good content
                }
            }
        }
        
        // fallback to body if nothing found
        if (content.length < 200) {
            content = $('body').text().trim();
        }
        
        // clean up the content
        content = cleanText(content);
        
        return content;
        
    } catch (error) {
        console.error(`Scraping error for ${url}:`, error.message);
        return null;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Clean up scraped text
 */
function cleanText(text) {
    return text
        .replace(/\s+/g, ' ')           // multiple spaces to single
        .replace(/\n\s*\n/g, '\n\n')    // multiple newlines to double
        .replace(/\t/g, ' ')             // tabs to spaces
        .trim()
        .substring(0, 5000);             // limit length
}

module.exports = {
    scrapeArticle
};
