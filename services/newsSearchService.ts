
import type { NewsArticle } from '../types.ts';
import { searchSymbolLogo, searchReasoningIllustration } from './imageSearchService.ts';

const GOOGLE_CUSTOM_SEARCH_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
const NEWS_CUSTOM_SEARCH_CX = process.env.NEWS_CUSTOM_SEARCH_CX;
const GOOGLEDOTCOM_CUSTOM_SEARCH_CX = process.env.GOOGLEDOTCOM_CUSTOM_SEARCH_CX;
const GOOGLE_CUSTOM_SEARCH_URL = 'https://www.googleapis.com/customsearch/v1';

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

if (!GOOGLE_CUSTOM_SEARCH_API_KEY || (!NEWS_CUSTOM_SEARCH_CX && !GOOGLEDOTCOM_CUSTOM_SEARCH_CX)) {
    console.warn("Google Custom Search API keys not set. Using FMP news as primary source.");
}

if (!FMP_API_KEY) {
    console.warn("FMP_API_KEY not set. Some news sources may be unavailable.");
}

// Helper function to check if URL is a valid news article
const isValidNewsUrl = (url: string): boolean => {
    const invalidPatterns = [
        'news.google.com',
        'finance.yahoo.com/quote',
        'finance.yahoo.com/lookup',
        'marketwatch.com/tools',
        'bloomberg.com/markets',
        'cnbc.com/quotes',
        '/search',
        '/category',
        '/tag',
        '/archive'
    ];
    
    return !invalidPatterns.some(pattern => url.toLowerCase().includes(pattern));
};

// Helper function to check if article is recent based on timeframe
const isRecentArticle = (snippet: string, title: string, timeframe: string): boolean => {
    const text = (snippet + ' ' + title).toLowerCase();
    
    // For longer timeframes (1Y+), be more lenient with dates
    if (timeframe.includes('Y') || timeframe === '6M') {
        // Only filter out very old content (2020-2022)
        const veryOldPatterns = [
            /202[0-2]/, // Years 2020-2022
            /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+202[0-2]/,
            /\d{1,2}\/\d{1,2}\/202[0-2]/,
            /202[0-2]-\d{2}-\d{2}/
        ];
        return !veryOldPatterns.some(pattern => pattern.test(text));
    }
    
    // For shorter timeframes, be more strict
    const oldDatePatterns = [
        /202[0-3]/, // Years 2020-2023 for short timeframes
        /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+202[0-3]/,
        /\d{1,2}\/\d{1,2}\/202[0-3]/,
        /202[0-3]-\d{2}-\d{2}/
    ];
    
    return !oldDatePatterns.some(pattern => pattern.test(text));
};

// Helper function to convert timeframe to FMP date range
const getDateRangeFromTimeframe = (timeframe: string): { from?: string, to?: string } => {
    const now = new Date();
    const timeframeLower = timeframe.toLowerCase();
    
    // For very short timeframes (minutes/hours), use last few days
    if (timeframeLower.includes('m') || timeframeLower.includes('h')) {
        const from = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
        return { from: from.toISOString().split('T')[0] };
    }
    
    // For daily timeframes
    if (timeframeLower === '1d') {
        const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 1 week ago
        return { from: from.toISOString().split('T')[0] };
    }
    
    if (timeframeLower === '3d') {
        const from = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 2 weeks ago
        return { from: from.toISOString().split('T')[0] };
    }
    
    if (timeframeLower === '7d') {
        const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 1 month ago
        return { from: from.toISOString().split('T')[0] };
    }
    
    // For weekly timeframes
    if (timeframeLower === '2w') {
        const from = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000); // 2 months ago
        return { from: from.toISOString().split('T')[0] };
    }
    
    if (timeframeLower === '1m') {
        const from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 3 months ago
        return { from: from.toISOString().split('T')[0] };
    }
    
    // For monthly timeframes
    if (timeframeLower === '3m') {
        const from = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); // 6 months ago
        return { from: from.toISOString().split('T')[0] };
    }
    
    if (timeframeLower === '6m') {
        const from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
        return { from: from.toISOString().split('T')[0] };
    }
    
    // For yearly timeframes
    if (timeframeLower.includes('y')) {
        const from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
        return { from: from.toISOString().split('T')[0] };
    }
    
    // Default fallback - last month
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { from: from.toISOString().split('T')[0] };
};

// Helper function to extract symbols from search terms
const extractSymbolsFromTerms = (searchTerms: string[]): string[] => {
    const symbols: string[] = [];
    
    for (const term of searchTerms) {
        // Look for stock symbols (2-5 uppercase letters)
        const symbolMatch = term.match(/\b[A-Z]{2,5}\b/);
        if (symbolMatch) {
            symbols.push(symbolMatch[0]);
        }
        
        // Common company name to symbol mappings
        const companyMappings: Record<string, string> = {
            'apple': 'AAPL',
            'microsoft': 'MSFT',
            'tesla': 'TSLA',
            'amazon': 'AMZN',
            'google': 'GOOGL',
            'alphabet': 'GOOGL',
            'meta': 'META',
            'facebook': 'META',
            'nvidia': 'NVDA',
            'netflix': 'NFLX',
            'spotify': 'SPOT'
        };
        
        const termLower = term.toLowerCase();
        for (const [company, symbol] of Object.entries(companyMappings)) {
            if (termLower.includes(company)) {
                symbols.push(symbol);
                break;
            }
        }
    }
    
    return [...new Set(symbols)]; // Remove duplicates
};

// Search FMP stock news by symbols
const searchFMPStockNews = async (symbols: string[], dateRange: { from?: string, to?: string }): Promise<NewsArticle[]> => {
    if (!FMP_API_KEY || symbols.length === 0) return [];
    
    const allNews: NewsArticle[] = [];
    
    try {
        // Search for each symbol (limit to first 3 to avoid rate limits)
        for (const symbol of symbols.slice(0, 3)) {
            const params = new URLSearchParams({
                symbols: symbol,
                limit: '15',
                apikey: FMP_API_KEY
            });
            
            if (dateRange.from) {
                params.append('from', dateRange.from);
            }
            
            const url = `${FMP_BASE_URL}/news/stock?${params.toString()}`;
            console.log(`Fetching FMP stock news for ${symbol}`);
            
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`FMP stock news failed for ${symbol}: ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            if (Array.isArray(data)) {
                const newsItems = data
                    .filter(item => item.title && item.url && isValidNewsUrl(item.url))
                    .map(item => ({
                        title: item.title || 'Untitled',
                        uri: item.url || '#',
                        snippet: item.text || '',
                        source: item.site || item.publisher || 'Unknown'
                    }));
                
                allNews.push(...newsItems);
                console.log(`Added ${newsItems.length} FMP stock news for ${symbol}`);
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    } catch (error) {
        console.error("Error fetching FMP stock news:", error);
    }
    
    return allNews;
};

// Search FMP general news
const searchFMPGeneralNews = async (limit: number = 10): Promise<NewsArticle[]> => {
    if (!FMP_API_KEY) return [];
    
    try {
        const params = new URLSearchParams({
            limit: limit.toString(),
            apikey: FMP_API_KEY
        });
        
        const url = `${FMP_BASE_URL}/news/general-latest?${params.toString()}`;
        console.log("Fetching FMP general news");
        
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`FMP general news failed: ${response.status}`);
            return [];
        }
        
        const data = await response.json();
        if (Array.isArray(data)) {
            const newsItems = data
                .filter(item => item.title && item.url && isValidNewsUrl(item.url))
                .map(item => ({
                    title: item.title || 'Untitled',
                    uri: item.url || '#',
                    snippet: item.text || '',
                    source: item.site || item.publisher || 'Unknown'
                }));
            
            console.log(`Added ${newsItems.length} FMP general news items`);
            return newsItems;
        }
    } catch (error) {
        console.error("Error fetching FMP general news:", error);
    }
    
    return [];
};

// Search FMP press releases
const searchFMPPressReleases = async (symbols: string[], dateRange: { from?: string, to?: string }): Promise<NewsArticle[]> => {
    if (!FMP_API_KEY || symbols.length === 0) return [];
    
    const allNews: NewsArticle[] = [];
    
    try {
        for (const symbol of symbols.slice(0, 2)) { // Limit to 2 symbols for press releases
            const params = new URLSearchParams({
                symbols: symbol,
                limit: '5',
                apikey: FMP_API_KEY
            });
            
            if (dateRange.from) {
                params.append('from', dateRange.from);
            }
            
            const url = `${FMP_BASE_URL}/news/press-releases?${params.toString()}`;
            console.log(`Fetching FMP press releases for ${symbol}`);
            
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`FMP press releases failed for ${symbol}: ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            if (Array.isArray(data)) {
                const newsItems = data
                    .filter(item => item.title && item.url && isValidNewsUrl(item.url))
                    .map(item => ({
                        title: item.title || 'Untitled',
                        uri: item.url || '#',
                        snippet: item.text || '',
                        source: item.site || item.publisher || 'Press Release'
                    }));
                
                allNews.push(...newsItems);
                console.log(`Added ${newsItems.length} FMP press releases for ${symbol}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    } catch (error) {
        console.error("Error fetching FMP press releases:", error);
    }
    
    return allNews;
};

// Helper function to create news-friendly search terms
const createNewsFriendlyTerms = (searchTerms: string[]): string[] => {
    const newsFriendlyTerms: string[] = [];
    
    for (const term of searchTerms) {
        // Extract company name and symbol from detailed terms
        const symbolMatch = term.match(/\b[A-Z]{2,5}\b/);
        const symbol = symbolMatch ? symbolMatch[0] : '';
        
        if (symbol) {
            // Create broader, news-friendly terms
            newsFriendlyTerms.push(`${symbol} stock`);
            newsFriendlyTerms.push(`${symbol} earnings`);
            
            // Add company name versions if we can identify them
            const companyMappings: Record<string, string> = {
                'AAPL': 'Apple',
                'MSFT': 'Microsoft',
                'GOOGL': 'Google',
                'TSLA': 'Tesla',
                'AMZN': 'Amazon',
                'META': 'Meta',
                'NVDA': 'Nvidia',
                'NFLX': 'Netflix',
                'AI': 'C3.ai'
            };
            
            if (companyMappings[symbol]) {
                newsFriendlyTerms.push(`${companyMappings[symbol]} stock`);
                newsFriendlyTerms.push(`${companyMappings[symbol]} financial`);
            }
        }
    }
    
    return [...new Set(newsFriendlyTerms)]; // Remove duplicates
};

// Search Google News with news-optimized search engine
const searchGoogleNews = async (searchTerms: string[], timeframe: string): Promise<NewsArticle[]> => {
    if (!GOOGLE_CUSTOM_SEARCH_API_KEY || !NEWS_CUSTOM_SEARCH_CX) {
        return [];
    }
    
    const allNews: NewsArticle[] = [];
    const newsFriendlyTerms = createNewsFriendlyTerms(searchTerms);
    
    try {
        for (const term of newsFriendlyTerms.slice(0, 3)) { // Use news-friendly terms
            const query = encodeURIComponent(term); // No quotes, simpler query
            const dateRestrict = getDateRestrictionFromTimeframe(timeframe);
            const url = `${GOOGLE_CUSTOM_SEARCH_URL}?key=${GOOGLE_CUSTOM_SEARCH_API_KEY}&cx=${NEWS_CUSTOM_SEARCH_CX}&q=${query}&num=8&dateRestrict=${dateRestrict}&sort=date&lr=lang_en`;
            
            console.log(`Fetching Google news for term: "${term}"`);
            
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Google news search failed for "${term}": ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            if (data.items && Array.isArray(data.items)) {
                const newsItems: NewsArticle[] = data.items
                    .filter((item: any) => {
                        const hasValidUrl = item.link && isValidNewsUrl(item.link);
                        const isRecent = isRecentArticle(item.snippet || '', item.title || '', timeframe);
                        const hasContent = item.title && item.title.length > 10;
                        return hasValidUrl && isRecent && hasContent;
                    })
                    .map((item: any) => ({
                        title: item.title || 'Untitled',
                        uri: item.link || '#',
                        snippet: item.snippet || '',
                        source: item.displayLink || 'Unknown'
                    }));
                
                allNews.push(...newsItems);
                console.log(`Added ${newsItems.length} Google news items for "${term}"`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    } catch (error) {
        console.error("Error searching Google news:", error);
    }
    
    return allNews;
};

// Search broader web content (blogs, analysis, scholarly articles)
const searchGoogleWeb = async (searchTerms: string[], timeframe: string): Promise<NewsArticle[]> => {
    if (!GOOGLE_CUSTOM_SEARCH_API_KEY || !GOOGLEDOTCOM_CUSTOM_SEARCH_CX) {
        return [];
    }
    
    const allNews: NewsArticle[] = [];
    const symbols = extractSymbolsFromTerms(searchTerms);
    
    try {
        for (const symbol of symbols.slice(0, 2)) {
            // Create broader search terms for web search
            const webTerms = [
                `${symbol} analysis 2024`,
                `${symbol} stock analysis`,
                `${symbol} investment thesis`
            ];
            
            for (const term of webTerms.slice(0, 2)) {
                const query = encodeURIComponent(term);
                const dateRestrict = getDateRestrictionFromTimeframe(timeframe);
                const url = `${GOOGLE_CUSTOM_SEARCH_URL}?key=${GOOGLE_CUSTOM_SEARCH_API_KEY}&cx=${GOOGLEDOTCOM_CUSTOM_SEARCH_CX}&q=${query}&num=4&dateRestrict=${dateRestrict}&sort=date&lr=lang_en`;
                
                console.log(`Fetching Google web content for term: "${term}"`);
                
                const response = await fetch(url);
                if (!response.ok) {
                    console.error(`Google web search failed for "${term}": ${response.status}`);
                    continue;
                }
                
                const data = await response.json();
                if (data.items && Array.isArray(data.items)) {
                    const webItems: NewsArticle[] = data.items
                        .filter((item: any) => {
                            const hasValidUrl = item.link && isValidNewsUrl(item.link);
                            const isRecent = isRecentArticle(item.snippet || '', item.title || '', timeframe);
                            const hasContent = item.title && item.title.length > 10;
                            // Filter for financial content sites
                            const isFinancialContent = item.link.includes('seeking') || 
                                                     item.link.includes('finance') || 
                                                     item.link.includes('investor') ||
                                                     item.link.includes('market') ||
                                                     item.link.includes('analyst') ||
                                                     item.link.includes('research');
                            return hasValidUrl && isRecent && hasContent && isFinancialContent;
                        })
                        .map((item: any) => ({
                            title: item.title || 'Untitled',
                            uri: item.link || '#',
                            snippet: item.snippet || '',
                            source: item.displayLink || 'Web'
                        }));
                    
                    allNews.push(...webItems);
                    console.log(`Added ${webItems.length} Google web items for "${term}"`);
                }
                
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
    } catch (error) {
        console.error("Error searching Google web:", error);
    }
    
    return allNews;
};

// Helper function from original code
function getDateRestrictionFromTimeframe(timeframe: string): string {
    const timeframeLower = timeframe.toLowerCase();
    
    if (timeframeLower.includes('m') || timeframeLower.includes('h')) {
        return 'd3';
    }
    if (timeframeLower === '1d') return 'd7';
    if (timeframeLower === '3d') return 'd14';
    if (timeframeLower === '7d') return 'd30';
    if (timeframeLower === '2w') return 'd60';
    if (timeframeLower === '1m') return 'd90';
    if (timeframeLower === '3m') return 'd180';
    if (timeframeLower === '6m') return 'd365';
    if (timeframeLower.includes('y')) return 'd365';
    
    return 'd30';
}

export const searchNews = async (searchTerms: string[], timeframe: string = '1M'): Promise<NewsArticle[]> => {
    if (searchTerms.length === 0) {
        console.warn("No search terms provided");
        return [];
    }

    console.log("🔍 Starting news search with terms:", searchTerms, "for timeframe:", timeframe);

    const allNews: NewsArticle[] = [];
    const dateRange = getDateRangeFromTimeframe(timeframe);
    const symbols = extractSymbolsFromTerms(searchTerms);

    try {
        // 1. First, try FMP stock news if we have symbols
        if (symbols.length > 0) {
            console.log("Searching FMP stock news for symbols:", symbols);
            const fmpStockNews = await searchFMPStockNews(symbols, dateRange);
            allNews.push(...fmpStockNews);
            
            // Also get press releases for these symbols
            const fmpPressReleases = await searchFMPPressReleases(symbols, dateRange);
            allNews.push(...fmpPressReleases);
        }

        // 2. Get some general financial news from FMP
        console.log("Searching FMP general news");
        const fmpGeneralNews = await searchFMPGeneralNews(12);
        allNews.push(...fmpGeneralNews);

        // 3. Fallback to Google Custom Search if FMP didn't return much
        if (allNews.length < 5) {
            console.log("FMP returned limited results, trying Google searches as fallback");
            
            // Try news-specific search first
            const googleNews = await searchGoogleNews(searchTerms, timeframe);
            allNews.push(...googleNews);
            
            // If still not enough, try broader web search
            if (allNews.length < 8) {
                console.log("Still limited results, trying broader web search");
                const googleWeb = await searchGoogleWeb(searchTerms, timeframe);
                allNews.push(...googleWeb);
            }
        }

    } catch (error) {
        console.error("Error in news search:", error);
        
        // Final fallback to Google searches if everything else fails
        try {
            const googleNews = await searchGoogleNews(searchTerms, timeframe);
            allNews.push(...googleNews);
            
            if (allNews.length < 3) {
                const googleWeb = await searchGoogleWeb(searchTerms, timeframe);
                allNews.push(...googleWeb);
            }
        } catch (fallbackError) {
            console.error("Fallback Google searches also failed:", fallbackError);
        }
    }

    // Remove duplicates based on title similarity and URI
    const uniqueNews = allNews.filter((article, index, self) => {
        return index === self.findIndex(a => 
            a.uri === article.uri || 
            (a.title.toLowerCase().substring(0, 50) === article.title.toLowerCase().substring(0, 50))
        );
    });

    // Sort by relevance first, then apply timeframe as secondary filter
    const sortedNews = uniqueNews
        .map(article => {
            // Calculate relevance score
            const relevanceScore = searchTerms.reduce((score, term) => {
                const termLower = term.toLowerCase();
                const titleHits = (article.title.toLowerCase().match(new RegExp(termLower, 'g')) || []).length;
                const snippetHits = (article.snippet.toLowerCase().match(new RegExp(termLower, 'g')) || []).length;
                
                // Additional relevance factors
                const symbolMatch = termLower.match(/\b[A-Z]{2,5}\b/) ? 1 : 0;
                const financeKeywords = ['stock', 'earnings', 'revenue', 'profit', 'financial', 'trading', 'market', 'investment'].some(keyword => 
                    article.title.toLowerCase().includes(keyword) || article.snippet.toLowerCase().includes(keyword)
                ) ? 1 : 0;
                
                return score + titleHits * 3 + snippetHits * 2 + symbolMatch + financeKeywords;
            }, 0);
            
            // Check if article matches timeframe (secondary criterion)
            const matchesTimeframe = isRecentArticle(article.snippet, article.title, timeframe);
            
            return {
                ...article,
                relevanceScore,
                matchesTimeframe
            };
        })
        .sort((a, b) => {
            // Primary sort by relevance
            if (a.relevanceScore !== b.relevanceScore) {
                return b.relevanceScore - a.relevanceScore;
            }
            // Secondary sort by timeframe match
            if (a.matchesTimeframe !== b.matchesTimeframe) {
                return a.matchesTimeframe ? -1 : 1;
            }
            return 0;
        })
        .map(({ relevanceScore, matchesTimeframe, ...article }) => article); // Remove scoring properties

    console.log(`📰 Final news search results: ${sortedNews.length} unique, relevant articles found`);
    console.log("📊 News sources breakdown:", sortedNews.map(article => article.source).join(", "));
    
    const finalResults = sortedNews.slice(0, 15);
    console.log(`🎯 Returning ${finalResults.length} articles to display (max 15)`);
    
    return finalResults;
};
