const OpenAI = require('openai');

// Lazily create client only when key exists
const getClient = () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === 'your_openai_api_key_here') return null;
  return new OpenAI({ apiKey: key });
};

async function enhanceArticle(originalTitle, originalContent, referenceArticles) {
  const openai = getClient();
  if (!openai) {
    console.log('OpenAI API key not configured, using mock enhancement');
    return mockEnhance(originalTitle, originalContent, referenceArticles);
  }

  try {
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
        { role: 'user', content: prompt }
      ],
      max_tokens: 2500,
      temperature: 0.7
    });

    let enhancedContent = response.choices[0].message.content;
    enhancedContent += generateReferencesSection(referenceArticles);
    return enhancedContent;
  } catch (error) {
    console.error('LLM enhancement error:', error.message);
    if (error.message.includes('quota') || error.message.includes('rate')) {
      console.log('API quota exceeded, using mock enhancement');
      return mockEnhance(originalTitle, originalContent, referenceArticles);
    }
    return null;
  }
}

function generateReferencesSection(references) {
  if (!references || references.length === 0) return '';
  let html = '\n\n<hr/>\n<h3>References & Further Reading</h3>\n<ul>\n';
  references.forEach(ref => {
    html += `  <li><a href="${ref.url}" target="_blank" rel="noopener noreferrer">${ref.title}</a> - ${ref.source}</li>\n`;
  });
  html += '</ul>';
  return html;
}

function mockEnhance(title, content, references) {
  console.log('Generating enhanced content (mock)...');
  let enhancedHtml = '';
  enhancedHtml += `<h2>${title}</h2>\n\n`;
  enhancedHtml += `<p><em>This article has been enhanced with additional insights and improved formatting for better readability.</em></p>\n\n`;

  if (content) {
    const sections = content.split(/(<h[23][^>]*>.*?<\/h[23]>|<p>.*?<\/p>|<ul>[\s\S]*?<\/ul>|<ol>[\s\S]*?<\/ol>)/gi)
      .filter(s => s && s.trim());

    let paragraphCount = 0;
    sections.forEach(section => {
      const trimmed = section.trim();
      if (!trimmed) return;
      if (trimmed.match(/^<h[23]/i)) {
        enhancedHtml += '\n' + trimmed + '\n';
      } else if (trimmed.match(/^<p>/i)) {
        enhancedHtml += trimmed + '\n';
        paragraphCount++;
        if (paragraphCount === 3 && !content.includes('<h2') && !content.includes('<h3')) {
          enhancedHtml += '\n<h3>Key Insights</h3>\n';
        }
      } else if (trimmed.match(/^<[uo]l>/i)) {
        enhancedHtml += trimmed + '\n';
      } else {
        const cleaned = cleanText(trimmed);
        if (cleaned.length > 30) {
          enhancedHtml += `<p>${cleaned}</p>\n`;
        }
      }
    });

    if (!enhancedHtml.includes('<p>') || enhancedHtml.length < 200) {
      const cleanedContent = cleanText(content);
      const sentences = cleanedContent.split(/(?<=[.!?])\s+/).filter(s => s.length > 20);
      if (sentences.length > 0) {
        for (let i = 0; i < sentences.length; i += 3) {
          const group = sentences.slice(i, i + 3).join(' ');
          if (group.length > 30) {
            enhancedHtml += `<p>${group}</p>\n`;
          }
          if (i === 0 && sentences.length > 4) {
            enhancedHtml += '\n<h3>Main Content</h3>\n';
          }
        }
      }
    }
  }

  enhancedHtml += '\n<h3>Summary</h3>\n';
  enhancedHtml += `<p>This enhanced version of "${title}" provides comprehensive insights on the topic. The content has been structured for improved readability while maintaining all the essential information from the original article.</p>\n`;

  if (references && references.length > 0) {
    enhancedHtml += '\n<hr/>\n<h3>Related Resources</h3>\n<ul>\n';
    references.forEach(ref => {
      enhancedHtml += `  <li><a href="${ref.url}" target="_blank" rel="noopener">${ref.title}</a> (${ref.source})</li>\n`;
    });
    enhancedHtml += '</ul>\n';
  }

  return enhancedHtml;
}

function cleanText(text) {
  if (!text) return '';
  let clean = text.replace(/<[^>]*>/g, ' ');
  clean = clean.replace(/[a-z-]+="[^"]*"/gi, '');
  clean = clean.replace(/\{[^}]*\}/g, '');
  clean = clean.replace(/\s+/g, ' ').trim();
  return clean;
}

module.exports = { enhanceArticle };
