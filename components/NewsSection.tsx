import React from 'react';
import type { NewsArticle } from '../types.ts';

interface NewsSectionProps {
    news: NewsArticle[];
}

export const NewsSection: React.FC<NewsSectionProps> = ({ news }) => {
    return (
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-4 text-gray-700 dark:text-gray-300">Relevant News (Powered by Google Search)</h3>
            {news.length > 0 ? (
                <div className="space-y-3">
                    {news.map((article, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-600 hover:shadow-sm dark:hover:border-indigo-500 transition-shadow">
                            <a 
                                href={article.uri} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium hover:underline"
                            >
                                {article.title}
                            </a>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 dark:text-gray-400">No relevant news articles were found by the AI analysis.</p>
            )}
        </div>
    );
};