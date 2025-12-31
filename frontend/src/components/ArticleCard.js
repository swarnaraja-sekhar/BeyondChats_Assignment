import React from 'react';
import { Link } from 'react-router-dom';

function ArticleCard({ article, onDelete }) {
    // helper to strip html tags for excerpt
    const stripHtml = (html) => {
        if (!html) return 'No content available';
        const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return text.length > 150 ? text.substring(0, 150) + '...' : text;
    };

    // format date nicely
    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return 'Unknown date';
        }
    };

    // get display content - prefer enhanced if available
    const getDisplayContent = () => {
        if (article.isEnhanced && article.enhancedContent) {
            return stripHtml(article.enhancedContent);
        }
        return article.excerpt || stripHtml(article.content);
    };

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
            {/* Article Image */}
            {article.imageUrl && (
                <div className="h-48 overflow-hidden bg-gray-100">
                    <img 
                        src={article.imageUrl} 
                        alt={article.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                </div>
            )}
            
            {/* Placeholder if no image */}
            {!article.imageUrl && (
                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-4xl">📝</span>
                </div>
            )}
            
            {/* Content */}
            <div className="p-6">
                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {article.isEnhanced ? (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            ✨ Enhanced
                        </span>
                    ) : (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            Original
                        </span>
                    )}
                    {article.references && article.references.length > 0 && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {article.references.length} sources
                        </span>
                    )}
                    <span className="text-gray-400 text-sm">
                        {formatDate(article.publishedDate || article.createdAt)}
                    </span>
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 hover:text-blue-600">
                    <Link to={`/article/${article._id}`}>
                        {article.enhancedTitle || article.title}
                    </Link>
                </h3>
                
                {/* Excerpt */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {getDisplayContent()}
                </p>
                
                {/* Author & Read More */}
                <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">
                        By {article.author || 'BeyondChats Team'}
                    </span>
                    <div className="flex items-center gap-3">
                        <Link 
                            to={`/article/${article._id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                        >
                            Read More 
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                title="Delete article"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ArticleCard;
