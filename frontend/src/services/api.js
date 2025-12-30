import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// create axios instance with base config
const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// get all articles with optional filters
export const getArticles = async (page = 1, limit = 10, enhanced = null) => {
    try {
        const params = { page, limit };
        if (enhanced !== null) {
            params.enhanced = enhanced;
        }
        const response = await api.get('/articles', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching articles:', error);
        throw error;
    }
};

// get single article by id
export const getArticle = async (id) => {
    try {
        const response = await api.get(`/articles/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching article:', error);
        throw error;
    }
};

// trigger scraping
export const scrapeArticles = async (count = 5) => {
    try {
        const response = await api.post('/articles/scrape', { count });
        return response.data;
    } catch (error) {
        console.error('Error scraping articles:', error);
        throw error;
    }
};

// delete article
export const deleteArticle = async (id) => {
    try {
        const response = await api.delete(`/articles/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting article:', error);
        throw error;
    }
};

export default api;
