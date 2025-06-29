
import React, { useState } from 'react';
import { searchNews } from '../services/newsSearchService.ts';
import { searchSymbolLogo, searchReasoningIllustration, searchFinancialImages } from '../services/imageSearchService.ts';
import { Spinner } from './Spinner.tsx';
import { SymbolSearchInput } from './SymbolSearchInput.tsx';
import type { NewsArticle, FmpSearchResult } from '../types.ts';
import type { ImageResult } from '../services/imageSearchService.ts';

export const DebugPage: React.FC = () => {
    const [selectedSymbols, setSelectedSymbols] = useState<FmpSearchResult[]>([
        { symbol: 'AAPL', name: 'Apple Inc.' }
    ]);
    const [timeframe, setTimeframe] = useState('1M');
    
    const [newsResults, setNewsResults] = useState<NewsArticle[]>([]);
    const [logoResults, setLogoResults] = useState<ImageResult[]>([]);
    const [illustrationResults, setIllustrationResults] = useState<ImageResult[]>([]);
    const [financialImageResults, setFinancialImageResults] = useState<ImageResult[]>([]);
    
    const [newsLoading, setNewsLoading] = useState(false);
    const [logoLoading, setLogoLoading] = useState(false);
    const [illustrationLoading, setIllustrationLoading] = useState(false);
    const [financialImageLoading, setFinancialImageLoading] = useState(false);
    
    const [newsError, setNewsError] = useState<string | null>(null);
    const [imageError, setImageError] = useState<string | null>(null);

    const handleAddSymbol = (symbol: FmpSearchResult) => {
        if (!selectedSymbols.find(s => s.symbol === symbol.symbol)) {
            setSelectedSymbols(prev => [...prev, symbol]);
        }
    };

    const handleRemoveSymbol = (symbolToRemove: string) => {
        setSelectedSymbols(prev => prev.filter(s => s.symbol !== symbolToRemove));
    };

    const getCurrentSymbol = () => {
        return selectedSymbols.length > 0 ? selectedSymbols[0] : null;
    };

    const testNewsSearch = async () => {
        const currentSymbol = getCurrentSymbol();
        if (!currentSymbol) {
            setNewsError('Please select a symbol first');
            return;
        }

        setNewsLoading(true);
        setNewsError(null);
        try {
            const searchTerms = [currentSymbol.symbol, currentSymbol.name];
            console.log('Testing news search with terms:', searchTerms);
            const results = await searchNews(searchTerms, timeframe);
            setNewsResults(results);
            console.log('News results:', results);
        } catch (error) {
            console.error('News search error:', error);
            setNewsError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setNewsLoading(false);
        }
    };

    const testLogoSearch = async () => {
        const currentSymbol = getCurrentSymbol();
        if (!currentSymbol) {
            setImageError('Please select a symbol first');
            return;
        }

        setLogoLoading(true);
        setImageError(null);
        try {
            console.log('Testing logo search for:', currentSymbol.symbol);
            const results = await searchSymbolLogo(currentSymbol.symbol);
            setLogoResults(results);
            console.log('Logo results:', results);
        } catch (error) {
            console.error('Logo search error:', error);
            setImageError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setLogoLoading(false);
        }
    };

    const testIllustrationSearch = async () => {
        const currentSymbol = getCurrentSymbol();
        if (!currentSymbol) {
            setImageError('Please select a symbol first');
            return;
        }

        setIllustrationLoading(true);
        setImageError(null);
        try {
            console.log('Testing illustration search for:', currentSymbol.symbol);
            const results = await searchReasoningIllustration(currentSymbol.symbol, 'technical analysis');
            setIllustrationResults(results);
            console.log('Illustration results:', results);
        } catch (error) {
            console.error('Illustration search error:', error);
            setImageError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setIllustrationLoading(false);
        }
    };

    const testFinancialImageSearch = async () => {
        const currentSymbol = getCurrentSymbol();
        if (!currentSymbol) {
            setImageError('Please select a symbol first');
            return;
        }

        setFinancialImageLoading(true);
        setImageError(null);
        try {
            console.log('Testing financial image search for:', currentSymbol.symbol);
            const results = await searchFinancialImages(currentSymbol.symbol);
            setFinancialImageResults(results);
            console.log('Financial image results:', results);
        } catch (error) {
            console.error('Financial image search error:', error);
            setImageError(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            setFinancialImageLoading(false);
        }
    };

    const checkEnvironmentVariables = () => {
        const envVars = {
            'GOOGLE_CUSTOM_SEARCH_API_KEY': !!process.env.GOOGLE_CUSTOM_SEARCH_API_KEY,
            'NEWS_CUSTOM_SEARCH_CX': !!process.env.NEWS_CUSTOM_SEARCH_CX,
            'IMAGE_CUSTOM_SEARCH_CX': !!process.env.IMAGE_CUSTOM_SEARCH_CX,
            'FMP_API_KEY': !!process.env.FMP_API_KEY,
            'API_KEY': !!process.env.API_KEY
        };

        return envVars;
    };

    const envVars = checkEnvironmentVariables();

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                    🔧 Debug Console - News & Images
                </h1>
                
                {/* Environment Variables Check */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Environment Variables Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(envVars).map(([key, isSet]) => (
                            <div key={key} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded border">
                                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${isSet ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                <span className="text-sm text-gray-600 dark:text-gray-400 truncate font-mono">{key}</span>
                            </div>
                        ))}
                    </div>
                </div>iv>

                {/* Symbol Selection */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        🔍 Symbol Selection
                    </h2>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <SymbolSearchInput
                            selectedSymbols={selectedSymbols}
                            onAddSymbol={handleAddSymbol}
                            onRemoveSymbol={handleRemoveSymbol}
                            isDisabled={false}
                            marketType="STOCKS"
                            market="US"
                        />
                        {selectedSymbols.length > 0 && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Currently testing with: <strong>{selectedSymbols[0].symbol}</strong> ({selectedSymbols[0].name})
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* News Testing Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        📰 News Search Testing
                    </h2>
                    
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <select
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value)}
                            className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        >
                            <option value="1d">1 Day</option>
                            <option value="7d">7 Days</option>
                            <option value="1M">1 Month</option>
                            <option value="3M">3 Months</option>
                            <option value="1Y">1 Year</option>
                        </select>
                        <button
                            onClick={testNewsSearch}
                            disabled={newsLoading || selectedSymbols.length === 0}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                        >
                            {newsLoading && <Spinner className="text-white" />}
                            <span>Test News</span>
                        </button>
                    </div>

                    {newsError && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-red-700 dark:text-red-300">Error: {newsError}</p>
                        </div>
                    )}

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Results ({newsResults.length} articles):
                        </h3>
                        {newsResults.length > 0 ? (
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {newsResults.map((article, index) => (
                                    <div key={index} className="p-3 bg-white dark:bg-gray-800 rounded border">
                                        <a 
                                            href={article.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm"
                                        >
                                            {article.title}
                                        </a>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            Source: {article.source}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                            {article.snippet.substring(0, 100)}...
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                No results found. Check API keys and try different search terms.
                            </p>
                        )}
                    </div>
                </div>

                {/* Image Testing Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                        🖼️ Image Search Testing
                    </h2>
                    
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex gap-2">
                            <button
                                onClick={testLogoSearch}
                                disabled={logoLoading || selectedSymbols.length === 0}
                                className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                            >
                                {logoLoading && <Spinner className="text-white" />}
                                <span>Logo</span>
                            </button>
                            <button
                                onClick={testIllustrationSearch}
                                disabled={illustrationLoading || selectedSymbols.length === 0}
                                className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
                            >
                                {illustrationLoading && <Spinner className="text-white" />}
                                <span>Charts</span>
                            </button>
                            <button
                                onClick={testFinancialImageSearch}
                                disabled={financialImageLoading || selectedSymbols.length === 0}
                                className="px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center space-x-2"
                            >
                                {financialImageLoading && <Spinner className="text-white" />}
                                <span>Financial</span>
                            </button>
                        </div>
                    </div>

                    {imageError && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-red-700 dark:text-red-300">Error: {imageError}</p>
                        </div>
                    )}

                    {/* Logo Results */}
                    {logoResults.length > 0 && (
                        <div className="mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Logo Results ({logoResults.length}):
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {logoResults.map((image, index) => (
                                    <div key={index} className="text-center">
                                        <img 
                                            src={image.url} 
                                            alt={image.title}
                                            className="w-full h-20 object-contain bg-white rounded border"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                                            }}
                                        />
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {image.source}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Illustration Results */}
                    {illustrationResults.length > 0 && (
                        <div className="mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Chart/Analysis Results ({illustrationResults.length}):
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {illustrationResults.map((image, index) => (
                                    <div key={index} className="text-center">
                                        <img 
                                            src={image.url} 
                                            alt={image.title}
                                            className="w-full h-24 object-cover rounded border"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                                            }}
                                        />
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {image.source}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Financial Image Results */}
                    {financialImageResults.length > 0 && (
                        <div className="mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Financial Image Results ({financialImageResults.length}):
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {financialImageResults.map((image, index) => (
                                    <div key={index} className="text-center">
                                        <img 
                                            src={image.url} 
                                            alt={image.title}
                                            className="w-full h-24 object-cover rounded border"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPgo=';
                                            }}
                                        />
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {image.source}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Console Log Instructions */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                        📝 Debugging Tips
                    </h3>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• Open browser console (F12) to see detailed API calls and responses</li>
                        <li>• Check if environment variables are properly set in Secrets</li>
                        <li>• Test with different search terms and timeframes</li>
                        <li>• Red indicators above show missing API keys</li>
                        <li>• Green indicators show properly configured keys</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
