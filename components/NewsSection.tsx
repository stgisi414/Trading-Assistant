import React from 'react';
import type { NewsArticle } from '../types.ts';

interface NewsSectionProps {
    news: NewsArticle[];
    theme?: string;
}

export const NewsSection: React.FC<NewsSectionProps> = ({ news, theme }) => {
    if (!news || news.length === 0) {
        return (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200">No recent news articles found for this analysis.</p>
            </div>
        );
    }
    return (
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-lg mb-4 text-gray-700 dark:text-gray-300">
                Relevant News (Powered by Google Custom Search)
            </h3>
            {news.length > 0 ? (
                <div className="space-y-4">
                    {news.map((article, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-600 hover:shadow-sm dark:hover:border-indigo-500 transition-shadow">
                            <a 
                                href={article.uri} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium hover:underline block mb-2"
                            >
                                {article.title}
                            </a>
                            {article.source && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                    Source: {article.source}
                                </p>
                            )}
                            {article.snippet && (
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {article.snippet}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 dark:text-gray-400">
                    No relevant news articles were found. Make sure your Google Custom Search API keys are configured.
                </p>
            )}
        </div>
    );
};