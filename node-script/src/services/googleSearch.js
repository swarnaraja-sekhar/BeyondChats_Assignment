const axios = require('axios');

const SERPAPI_KEY = process.env.SERPAPI_KEY;

/**
 * Search Google for articles related to a given title
 * Uses SerpAPI for reliable Google search results
 */
async function searchGoogle(query) {
    if (!SERPAPI_KEY) {
        console.log('Warning: SERPAPI_KEY not set, using mock results');
        return getMockResults(query);
    }
    
    try {
        // adding "blog" or "article" to get better results
        const searchQuery = `${query} blog article`;
        
        const response = await axios.get('https://serpapi.com/search', {
            params: {
                q: searchQuery,
                api_key: SERPAPI_KEY,
                engine: 'google',
                num: 10,
                gl: 'us',
                hl: 'en'
            }
        });
        
        const results = response.data.organic_results || [];
        
        // filter to get only blog/article results, exclude our own site
        const filteredResults = results.filter(result => {
            const url = result.link.toLowerCase();
            const title = (result.title || '').toLowerCase();
            
            // skip beyondchats own site
            if (url.includes('beyondchats.com')) return false;
            
            // skip social media and non-article sites
            if (url.includes('youtube.com')) return false;
            if (url.includes('facebook.com')) return false;
            if (url.includes('twitter.com')) return false;
            if (url.includes('linkedin.com/posts')) return false;
            if (url.includes('pinterest.com')) return false;
            
            // prefer blog-like URLs
            const isBlogLike = url.includes('blog') || 
                              url.includes('article') || 
                              url.includes('post') ||
                              url.includes('news') ||
                              title.includes('guide') ||
                              title.includes('how to');
            
            return true; // accept all that pass filters
        });
        
        return filteredResults.slice(0, 5).map(r => ({
            title: r.title,
            link: r.link,
            snippet: r.snippet
        }));
        
    } catch (error) {
        console.error('Google search error:', error.message);
        return getMockResults(query);
    }
}

// Mock results for testing without API key
function getMockResults(query) {
    console.log('Using mock search results for testing...');
    return [
        {
            title: `Best Practices for ${query} - TechBlog`,
            link: 'https://example-blog.com/best-practices',
            snippet: 'Learn about the best practices and strategies...'
        },
        {
            title: `Complete Guide to ${query} - Industry News`,
            link: 'https://industry-news.com/complete-guide',
            snippet: 'A comprehensive guide covering all aspects...'
        }
    ];
}

module.exports = {
    searchGoogle
};
