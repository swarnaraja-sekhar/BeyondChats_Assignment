const axios = require('axios');

/**
 * Search Google for articles related to a given title via Zenserp API.
 * Falls back to mock results when key is missing.
 */
async function searchGoogle(query) {
  const ZENSERP_API_KEY = process.env.ZENSERP_API_KEY;
  console.log(`[GoogleSearch] Searching for: "${query}"`);
  console.log(`[GoogleSearch] ZENSERP_API_KEY present: ${!!ZENSERP_API_KEY && ZENSERP_API_KEY !== 'your_zenserp_api_key_here'}`);
  
  if (!ZENSERP_API_KEY || ZENSERP_API_KEY === 'your_zenserp_api_key_here') {
    console.log('[GoogleSearch] ZENSERP_API_KEY not configured, using mock results');
    return getMockResults(query);
  }

  try {
    const searchQuery = `${query} blog article`;

    const response = await axios.get('https://app.zenserp.com/api/v2/search', {
      params: { q: searchQuery, num: 10 },
      headers: { apikey: ZENSERP_API_KEY }
    });

    const results = response.data.organic || [];

    console.log(`[GoogleSearch] Got ${results.length} results from Zenserp`);
    
    const filtered = results.filter(result => {
      const url = (result.url || '').toLowerCase();
      if (url.includes('beyondchats.com')) return false;
      if (url.includes('youtube.com')) return false;
      if (url.includes('facebook.com')) return false;
      if (url.includes('twitter.com')) return false;
      if (url.includes('linkedin.com/posts')) return false;
      if (url.includes('pinterest.com')) return false;
      return true;
    });

    console.log(`[GoogleSearch] ${filtered.length} results after filtering`);
    const finalResults = filtered.slice(0, 5).map(r => ({
      title: r.title,
      link: r.url,
      snippet: r.description
    }));
    console.log(`[GoogleSearch] Returning ${finalResults.length} results`);
    return finalResults;
  } catch (error) {
    console.error('[GoogleSearch] Error:', error.message);
    return getMockResults(query);
  }
}

// Mock results for testing without API key
function getMockResults(query) {
  console.log(`[GoogleSearch] Using mock search results for: "${query}"`);
  return [
    {
      title: 'Best Practices for AI Chatbots - Tech Insights',
      link: 'mock://article-1',
      snippet: 'Learn about the best practices for implementing AI chatbots...',
      mockContent: `
        <h2>Introduction to AI Chatbots</h2>
        <p>AI chatbots have revolutionized the way businesses interact with customers. They provide 24/7 support, handle multiple queries simultaneously, and can significantly reduce operational costs.</p>
        <h2>Key Features of Modern Chatbots</h2>
        <ul>
          <li>Natural Language Processing (NLP) for understanding user intent</li>
          <li>Machine Learning for continuous improvement</li>
          <li>Integration with CRM and other business tools</li>
          <li>Multi-channel support (web, mobile, social media)</li>
        </ul>
        <h2>Best Practices</h2>
        <p>When implementing a chatbot, consider these best practices:</p>
        <ol>
          <li>Define clear use cases and goals</li>
          <li>Design conversational flows that feel natural</li>
          <li>Always provide an option to speak with a human</li>
          <li>Continuously train and improve your bot</li>
          <li>Monitor performance metrics and user satisfaction</li>
        </ol>
        <h2>Conclusion</h2>
        <p>A well-implemented chatbot can transform customer service and drive business growth. Focus on user experience and continuous improvement for best results.</p>
      `
    },
    {
      title: 'The Complete Guide to Conversational AI - Industry Report',
      link: 'mock://article-2',
      snippet: 'A comprehensive guide covering all aspects of conversational AI...',
      mockContent: `
        <h2>What is Conversational AI?</h2>
        <p>Conversational AI refers to technologies that enable computers to simulate human-like conversations. This includes chatbots, virtual assistants, and voice-enabled devices.</p>
        <h2>Benefits for Businesses</h2>
        <p>Organizations implementing conversational AI see significant benefits:</p>
        <ul>
          <li>Reduced customer service costs by up to 30%</li>
          <li>Improved response times and availability</li>
          <li>Enhanced customer satisfaction scores</li>
          <li>Valuable insights from conversation analytics</li>
        </ul>
        <h2>Implementation Strategies</h2>
        <p>Successful implementation requires careful planning:</p>
        <ol>
          <li>Start with a pilot program</li>
          <li>Focus on high-volume, repetitive queries first</li>
          <li>Integrate with existing systems</li>
          <li>Train staff to work alongside AI</li>
        </ol>
        <h2>Future Trends</h2>
        <p>The future of conversational AI includes more advanced NLP, emotional intelligence, and seamless omnichannel experiences.</p>
      `
    }
  ];
}

module.exports = { searchGoogle };
