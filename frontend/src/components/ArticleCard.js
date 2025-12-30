import React from 'react';
import { Link } from 'react-router-dom';

function ArticleCard({ article }) {
    // helper to strip html tags for excerpt
    const stripHtml = (html) => {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
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

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
            {/* Article Image */}
            {article.imageUrl && (
                <div className="h-48 overflow-hidden">
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
            
            {/* Content */}
            <div className="p-6">
                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-3">
                    {article.isEnhanced ? (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            ✨ Enhanced
                        </span>
                    ) : (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            Original
                        </span>
                    )}
                    <span className="text-gray-400 text-sm">
                        {formatDate(article.publishedDate || article.createdAt)}
                    </span>
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 hover:text-blue-600">
                    <Link to={`/article/${article._id}`}>
                        {article.title}
                    </Link>
                </h3>
                
                {/* Excerpt */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {article.excerpt || stripHtml(article.content)}
                </p>
                
                {/* Author & Read More */}
                <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">
                        By {article.author || 'BeyondChats Team'}
                    </span>
                    <Link 
                        to={`/article/${article._id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                    >
                        Read More 
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ArticleCard;
