require('dotenv').config();
const axios = require('axios');
const googleSearchService = require('./services/googleSearch');
const scraperService = require('./services/scraper');
const llmService = require('./services/llm');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';

// main function to process articles
async function processArticles() {
    console.log('Starting article enhancement process...');
    console.log('='.repeat(50));
    
    try {
        // Step 1: Fetch articles that need enhancement from our API
        console.log('\n📥 Fetching pending articles from API...');
        const pendingResponse = await axios.get(`${API_BASE_URL}/articles/pending`);
        const articles = pendingResponse.data.data;
        
        if (!articles || articles.length === 0) {
            console.log('No articles pending for enhancement.');
            console.log('Try running the scrape endpoint first: POST /api/articles/scrape');
            return;
        }
        
        console.log(`Found ${articles.length} articles to process`);
        
        // Process each article
        for (let i = 0; i < articles.length; i++) {
            const article = articles[i];
            console.log(`\n${'='.repeat(50)}`);
            console.log(`Processing article ${i + 1}/${articles.length}`);
            console.log(`Title: ${article.title}`);
            
            try {
                await processsingArticle(article);
            } catch (err) {
                console.error(`Failed to process article: ${err.message}`);
                // continue with next article even if one fails
            }
            
            // small delay between articles to be nice to APIs
            if (i < articles.length - 1) {
                console.log('Waiting before next article...');
                await sleep(2000);
            }
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ Article enhancement process completed!');
        
    } catch (error) {
        console.error('Error in main process:', error.message);
        if (error.response) {
            console.error('API Error:', error.response.data);
        }
    }
}

// process a single article - search, scrape, enhance, publish
async function processsingArticle(article) {
    // Step 2: Search Google for similar articles
    console.log('\n🔍 Searching Google for similar articles...');
    const searchResults = await googleSearchService.searchGoogle(article.title);
    
    if (!searchResults || searchResults.length === 0) {
        console.log('No search results found, skipping enhancement');
        return;
    }
    
    console.log(`Found ${searchResults.length} relevant articles from Google`);
    
    // Step 3: Scrape content from the found articles
    console.log('\n📄 Scraping content from reference articles...');
    const scrapedArticles = [];
    
    for (const result of searchResults.slice(0, 2)) { // only first 2
        try {
            console.log(`  Scraping: ${result.link}`);
            const content = await scraperService.scrapeArticle(result.link);
            if (content && content.length > 100) {
                scrapedArticles.push({
                    title: result.title,
                    url: result.link,
                    source: new URL(result.link).hostname,
                    content: content
                });
            }
        } catch (err) {
            console.log(`  Failed to scrape ${result.link}: ${err.message}`);
        }
    }
    
    if (scrapedArticles.length === 0) {
        console.log('Could not scrape any reference articles, skipping');
        return;
    }
    
    console.log(`Successfully scraped ${scrapedArticles.length} reference articles`);
    
    // Step 4: Use LLM to enhance the article
    console.log('\n🤖 Enhancing article with LLM...');
    const enhancedContent = await llmService.enhanceArticle(
        article.title,
        article.content,
        scrapedArticles
    );
    
    if (!enhancedContent) {
        console.log('LLM enhancement failed, skipping');
        return;
    }
    
    // Step 5: Update the article via API
    console.log('\n📤 Publishing enhanced article...');
    
    // prepare references for citation
    const references = scrapedArticles.map(ref => ({
        title: ref.title,
        url: ref.url,
        source: ref.source
    }));
    
    const updateData = {
        enhancedContent: enhancedContent,
        enhancedTitle: article.title, // keeping same title for now
        references: references,
        isEnhanced: true,
        enhancedAt: new Date().toISOString()
    };
    
    const updateResponse = await axios.put(
        `${API_BASE_URL}/articles/${article._id}`,
        updateData
    );
    
    if (updateResponse.data.success) {
        console.log('✅ Article enhanced and published successfully!');
    } else {
        console.log('Failed to update article:', updateResponse.data);
    }
}

// helper function for delays
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the script
processArticles()
    .then(() => {
        console.log('\nScript finished.');
        process.exit(0);
    })
    .catch(err => {
        console.error('Script error:', err);
        process.exit(1);
    });
