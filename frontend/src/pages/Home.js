import React, { useState, useEffect } from 'react';
import ArticleCard from '../components/ArticleCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getArticles, scrapeArticles } from '../services/api';

function Home() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, original, enhanced
    const [scraping, setScraping] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // fetch articles on load and when filter changes
    useEffect(() => {
        fetchArticles();
    }, [filter, page]);

    const fetchArticles = async () => {
        setLoading(true);
        setError(null);
        
        try {
            let enhancedFilter = null;
            if (filter === 'enhanced') enhancedFilter = true;
            if (filter === 'original') enhancedFilter = false;
            
            const response = await getArticles(page, 9, enhancedFilter);
            setArticles(response.data || []);
            setTotalPages(response.pages || 1);
        } catch (err) {
            setError('Failed to load articles. Make sure the backend is running.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // handle scrape button click
    const handleScrape = async () => {
        setScraping(true);
        try {
            await scrapeArticles(5);
            // refresh the list after scraping
            await fetchArticles();
            alert('Articles scraped successfully!');
        } catch (err) {
            alert('Failed to scrape articles: ' + (err.response?.data?.message || err.message));
        } finally {
            setScraping(false);
        }
    };

    return (
        <div>
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
                <h1 className="text-4xl font-bold mb-4">BeyondChats Article Hub</h1>
                <p className="text-lg opacity-90 mb-6">
                    Explore original and AI-enhanced articles from BeyondChats blog. 
                    See how we use LLM technology to improve content quality.
                </p>
                <button
                    onClick={handleScrape}
                    disabled={scraping}
                    className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {scraping ? 'Scraping...' : '🔄 Scrape New Articles'}
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => { setFilter('all'); setPage(1); }}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        filter === 'all' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    All Articles
                </button>
                <button
                    onClick={() => { setFilter('original'); setPage(1); }}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        filter === 'original' 
                            ? 'bg-yellow-500 text-white' 
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    Original Only
                </button>
                <button
                    onClick={() => { setFilter('enhanced'); setPage(1); }}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        filter === 'enhanced' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    ✨ Enhanced Only
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading && <LoadingSpinner />}

            {/* Articles Grid */}
            {!loading && !error && (
                <>
                    {articles.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg mb-4">No articles found.</p>
                            <p className="text-gray-400">
                                Click the "Scrape New Articles" button to fetch articles from BeyondChats blog.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {articles.map(article => (
                                <ArticleCard key={article._id} article={article} />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-8">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-white rounded-lg disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 bg-white rounded-lg disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default Home;
