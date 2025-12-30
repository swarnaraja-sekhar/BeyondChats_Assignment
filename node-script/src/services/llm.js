const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Enhance an article using GPT to make it similar to top-ranking articles
 * while keeping the original meaning and adding proper citations
 */
async function enhanceArticle(originalTitle, originalContent, referenceArticles) {
    // check if API key is set
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        console.log('OpenAI API key not configured, using mock enhancement');
        return mockEnhance(originalTitle, originalContent, referenceArticles);
    }
    
    try {
        // prepare reference content for the prompt
        const refContent = referenceArticles.map((ref, i) => 
            `Reference Article ${i + 1} (${ref.source}):\n${ref.content.substring(0, 1500)}`
        ).join('\n\n---\n\n');
        
        const prompt = `You are a professional content writer. Your task is to enhance and improve the following blog article by:

1. Improving the structure and formatting
2. Making the content more engaging and informative
3. Adding relevant insights from the reference articles provided
4. Keeping the core message and information from the original
5. Using proper headings, bullet points, and paragraphs
6. Making it SEO-friendly

IMPORTANT: 
- Keep the enhanced article in HTML format with proper tags (<h2>, <p>, <ul>, <li>, etc.)
- Do NOT include references section - that will be added separately
- Maintain a professional and authoritative tone

ORIGINAL ARTICLE:
Title: ${originalTitle}
Content: ${originalContent.substring(0, 3000)}

REFERENCE ARTICLES FOR STYLE AND CONTENT IDEAS:
${refContent}

Please provide the enhanced article content in HTML format:`;

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional content writer who creates high-quality, engaging blog articles. Always respond with well-formatted HTML content.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 2500,
            temperature: 0.7
        });
        
        let enhancedContent = response.choices[0].message.content;
        
        // add references section at the bottom
        enhancedContent += generateReferencesSection(referenceArticles);
        
        return enhancedContent;
        
    } catch (error) {
        console.error('LLM enhancement error:', error.message);
        
        // if its a quota error, use mock
        if (error.message.includes('quota') || error.message.includes('rate')) {
            console.log('API quota exceeded, using mock enhancement');
            return mockEnhance(originalTitle, originalContent, referenceArticles);
        }
        
        return null;
    }
}

/**
 * Generate HTML references section
 */
function generateReferencesSection(references) {
    if (!references || references.length === 0) return '';
    
    let html = '\n\n<hr/>\n<h3>References & Further Reading</h3>\n<ul>\n';
    
    references.forEach(ref => {
        html += `  <li><a href="${ref.url}" target="_blank" rel="noopener noreferrer">${ref.title}</a> - ${ref.source}</li>\n`;
    });
    
    html += '</ul>';
    
    return html;
}

/**
 * Mock enhancement for testing without API key
 */
function mockEnhance(title, content, references) {
    console.log('Generating mock enhanced content...');
    
    // simple enhancement - just wrap in better HTML structure
    const enhancedContent = `
<article>
    <h1>${title}</h1>
    
    <div class="intro">
        <p><strong>Updated and Enhanced Article</strong></p>
        <p>This article has been enhanced with insights from top-ranking content across the web.</p>
    </div>
    
    <h2>Overview</h2>
    <p>${content.substring(0, 500)}...</p>
    
    <h2>Key Takeaways</h2>
    <ul>
        <li>Improved content structure and readability</li>
        <li>Enhanced with industry best practices</li>
        <li>Updated with latest information</li>
    </ul>
    
    <h2>Detailed Content</h2>
    <p>${content.substring(500, 1500) || content}</p>
    
    <h2>Conclusion</h2>
    <p>This enhanced version provides a more comprehensive overview of the topic with improved formatting and additional insights.</p>
</article>

${generateReferencesSection(references)}`;

    return enhancedContent;
}

module.exports = {
    enhanceArticle
};
