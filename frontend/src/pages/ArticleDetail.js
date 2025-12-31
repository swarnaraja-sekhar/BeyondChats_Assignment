import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getArticle, enhanceArticle } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function ArticleDetail() {
    const { id } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEnhanced, setShowEnhanced] = useState(false);
    const [enhancing, setEnhancing] = useState(false);

    useEffect(() => {
        fetchArticle();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchArticle = async () => {
        setLoading(true);
        try {
            const response = await getArticle(id);
            setArticle(response.data);
            // default to enhanced version if available
            if (response.data.isEnhanced) {
                setShowEnhanced(true);
            }
        } catch (err) {
            setError('Failed to load article');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
        });
    };

    const handleEnhance = async () => {
        setEnhancing(true);
        try {
            await enhanceArticle(id);
            // Poll for completion
            await pollForEnhancement();
        } catch (err) {
            alert('Enhancement failed: ' + (err.response?.data?.error || err.message));
            setEnhancing(false);
        }
    };

    const pollForEnhancement = async () => {
        const maxAttempts = 60; // up to 60 seconds
        const delayMs = 1000;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await getArticle(id);
                if (response.data.isEnhanced) {
                    setArticle(response.data);
                    setShowEnhanced(true);
                    setEnhancing(false);
                    return;
                }
            } catch (err) {
                console.error('Poll failed:', err);
            }
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        // Timeout - refresh anyway
        await fetchArticle();
        setEnhancing(false);
        alert('Enhancement is still processing. Refresh later.');
    };

    // Clean content by removing icon characters, HTML junk, and attributes while preserving structure
    const cleanContent = (html) => {
        if (!html) return '';
        
        let cleaned = html;
        
        // Remove SVG tags and icon elements
        cleaned = cleaned.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '');
        cleaned = cleaned.replace(/<i[^>]*class="[^"]*icon[^"]*"[^>]*>[\s\S]*?<\/i>/gi, '');
        cleaned = cleaned.replace(/<i[^>]*class="[^"]*fa[^"]*"[^>]*>[\s\S]*?<\/i>/gi, '');
        cleaned = cleaned.replace(/<span[^>]*class="[^"]*icon[^"]*"[^>]*>[\s\S]*?<\/span>/gi, '');
        
        // Remove script and style tags
        cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        
        // Remove HTML attribute data that got scraped
        cleaned = cleaned.replace(/\s*[a-z-]+settings="[^"]*"/gi, '');
        cleaned = cleaned.replace(/\s*data-[a-z-]+="[^"]*"/gi, '');
        cleaned = cleaned.replace(/\s*class="[^"]*elementor[^"]*"/gi, '');
        
        // Remove JSON-like content that shouldn't be there
        cleaned = cleaned.replace(/\{"[^}]*\}/g, '');
        cleaned = cleaned.replace(/\[[^\]]*"sticky[^\]]*\]/g, '');
        
        // Remove lines that are just attribute junk
        cleaned = cleaned.replace(/<p>[^<]*settings[^<]*<\/p>/gi, '');
        cleaned = cleaned.replace(/<p>[^<]*sticky[^<]*offset[^<]*<\/p>/gi, '');
        cleaned = cleaned.replace(/<p>[^<]*elementor[^<]*<\/p>/gi, '');
        
        // Remove common icon unicode characters (private use area)
        cleaned = cleaned.replace(/[\uE000-\uF8FF]/g, '');
        
        // Clean up empty elements
        cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');
        cleaned = cleaned.replace(/<p>\s*>\s*<\/p>/gi, '');
        cleaned = cleaned.replace(/<div>\s*<\/div>/gi, '');
        cleaned = cleaned.replace(/<span>\s*<\/span>/gi, '');
        
        // Remove orphaned tags and junk
        cleaned = cleaned.replace(/<p>\s*<a[^>]*>\s*<\/a>\s*<\/p>/gi, '');
        cleaned = cleaned.replace(/<p>\s*[<>]\s*<\/p>/gi, '');
        
        // Normalize whitespace between tags
        cleaned = cleaned.replace(/>\s+</g, '>\n<');
        
        // Ensure proper spacing for readability
        cleaned = cleaned.replace(/<\/h([234])>/gi, '</h$1>\n');
        cleaned = cleaned.replace(/<\/p>/gi, '</p>\n');
        cleaned = cleaned.replace(/<\/ul>/gi, '</ul>\n');
        cleaned = cleaned.replace(/<\/ol>/gi, '</ol>\n');
        cleaned = cleaned.replace(/<\/blockquote>/gi, '</blockquote>\n');
        
        return cleaned.trim();
    };

    if (loading) return <LoadingSpinner />;

    if (error || !article) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl text-red-600 mb-4">Error</h2>
                <p className="text-gray-600 mb-4">{error || 'Article not found'}</p>
                <Link to="/" className="text-blue-600 hover:underline">
                    ← Back to Home
                </Link>
            </div>
        );
    }

    const rawContent = showEnhanced && article.enhancedContent 
        ? article.enhancedContent 
        : article.content;
    
    const currentContent = cleanContent(rawContent);

    const currentTitle = showEnhanced && article.enhancedTitle 
        ? article.enhancedTitle 
        : article.title;

    return (
        <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <Link 
                to="/" 
                className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
            >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Articles
            </Link>

            {/* Article Container */}
            <article className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Featured Image */}
                {article.imageUrl && (
                    <div className="h-64 md:h-80 overflow-hidden">
                        <img 
                            src={article.imageUrl} 
                            alt={currentTitle}
                            className="w-full h-full object-cover"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    </div>
                )}

                <div className="p-8">
                    {/* Version Toggle - only show if enhanced version exists */}
                    {article.isEnhanced && (
                        <div className="flex items-center gap-4 mb-6 p-4 bg-gray-100 rounded-lg">
                            <span className="text-gray-700 font-medium">View:</span>
                            <button
                                onClick={() => setShowEnhanced(false)}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    !showEnhanced 
                                        ? 'bg-yellow-500 text-white' 
                                        : 'bg-white text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Original
                            </button>
                            <button
                                onClick={() => setShowEnhanced(true)}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    showEnhanced 
                                        ? 'bg-green-600 text-white' 
                                        : 'bg-white text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                ✨ Enhanced
                            </button>
                        </div>
                    )}

                    {/* Status Badge + Enhance Button */}
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                        {showEnhanced && article.isEnhanced ? (
                            <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                                ✨ Enhanced Version
                            </span>
                        ) : (
                            <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
                                Original Article
                            </span>
                        )}
                        {!article.isEnhanced && (
                            <button
                                onClick={handleEnhance}
                                disabled={enhancing}
                                className="bg-purple-600 text-white text-sm font-medium px-4 py-1.5 rounded-full hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {enhancing ? 'Enhancing...' : '🚀 Enhance'}
                            </button>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                        {currentTitle}
                    </h1>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 text-gray-500 text-sm mb-8 pb-8 border-b">
                        <span>By {article.author || 'BeyondChats Team'}</span>
                        <span>•</span>
                        <span>{formatDate(article.publishedDate || article.createdAt)}</span>
                        {article.sourceUrl && (
                            <>
                                <span>•</span>
                                <a 
                                    href={article.sourceUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    View Original Source
                                </a>
                            </>
                        )}
                    </div>

                    {/* Article Content */}
                    <div 
                        className="prose prose-lg max-w-none article-content"
                        dangerouslySetInnerHTML={{ __html: currentContent || '<p>No content available</p>' }}
                    />

                    {/* Show raw content if HTML seems broken */}
                    {(!currentContent || currentContent.length < 50) && article.excerpt && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-gray-700">{article.excerpt}</p>
                        </div>
                    )}

                    {/* References Section - only for enhanced articles */}
                    {showEnhanced && article.references && article.references.length > 0 && (
                        <div className="mt-12 pt-8 border-t">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">
                                📚 References & Sources
                            </h3>
                            <ul className="space-y-2">
                                {article.references.map((ref, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-blue-600">•</span>
                                        <a 
                                            href={ref.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                        >
                                            {ref.title}
                                        </a>
                                        <span className="text-gray-400">({ref.source})</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Enhancement Info */}
                    {showEnhanced && article.enhancedAt && (
                        <div className="mt-8 p-4 bg-green-50 rounded-lg text-sm text-green-700">
                            This article was enhanced on {formatDate(article.enhancedAt)} using AI to improve 
                            content quality and structure based on top-ranking articles.
                        </div>
                    )}
                </div>
            </article>
        </div>
    );
}

export default ArticleDetail;
