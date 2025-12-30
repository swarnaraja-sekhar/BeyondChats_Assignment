import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
    return (
        <nav className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    <Link to="/" className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-xl">B</span>
                        </div>
                        <span className="text-white text-xl font-bold">BeyondChats</span>
                    </Link>
                    
                    <div className="flex items-center space-x-6">
                        <Link 
                            to="/" 
                            className="text-white hover:text-blue-200 transition-colors"
                        >
                            Home
                        </Link>
                        <a 
                            href="https://beyondchats.com/blogs/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-white hover:text-blue-200 transition-colors"
                        >
                            Original Blog
                        </a>
                        <a 
                            href="https://github.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                        >
                            GitHub
                        </a>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
