
import type { NewsArticle } from '../types.ts';

const GOOGLE_CUSTOM_SEARCH_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
const NEWS_CUSTOM_SEARCH_CX = process.env.NEWS_CUSTOM_SEARCH_CX;
const GOOGLE_CUSTOM_SEARCH_URL = 'https://www.googleapis.com/customsearch/v1';

if (!GOOGLE_CUSTOM_SEARCH_API_KEY || !NEWS_CUSTOM_SEARCH_CX) {
    console.warn("Google Custom Search API keys not set. News search will be disabled.");
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

// Helper function to construct intelligent search queries with boolean operators
const constructIntelligentQuery = (searchTerm: string): string => {
    // Common financial keywords that indicate intent
    const intentKeywords = {
        analysis: ['analysis', 'outlook', 'forecast', 'commentary', 'review', 'report'],
        earnings: ['earnings', 'results', 'revenue', 'profit', 'financial results'],
        news: ['news', 'announcement', 'update', 'development', 'breaking'],
        performance: ['performance', 'returns', 'gains', 'losses', 'movement'],
        rating: ['rating', 'upgrade', 'downgrade', 'recommendation', 'target price'],
        general: ['stock', 'shares', 'financial', 'market', 'trading']
    };

    // Common ticker symbols and their full names for major ETFs and stocks
    const assetMapping: Record<string, string[]> = {
        'SPDR S&P 500 ETF': ['SPY', 'SPDR S&P 500'],
        'iShares Russell 2000 ETF': ['IWM', 'Russell 2000'],
        'Invesco QQQ Trust': ['QQQ', 'NASDAQ-100'],
        'Apple': ['AAPL', 'Apple Inc'],
        'Microsoft': ['MSFT', 'Microsoft Corporation'],
        'Tesla': ['TSLA', 'Tesla Inc'],
        'Amazon': ['AMZN', 'Amazon.com'],
        'Google': ['GOOGL', 'GOOG', 'Alphabet'],
        'Meta': ['META', 'Facebook'],
        'NVIDIA': ['NVDA', 'Nvidia Corporation']
    };

    // Parse the search term to identify asset and intent
    const termLower = searchTerm.toLowerCase();
    let assetPart = '';
    let intentPart = '';
    let detectedTickers: string[] = [];

    // Find the primary asset in the search term
    for (const [fullName, tickers] of Object.entries(assetMapping)) {
        if (termLower.includes(fullName.toLowerCase())) {
            assetPart = fullName;
            detectedTickers = tickers;
            break;
        }
        // Check if any ticker is mentioned
        for (const ticker of tickers) {
            if (termLower.includes(ticker.toLowerCase())) {
                assetPart = fullName;
                detectedTickers = tickers;
                break;
            }
        }
        if (assetPart) break;
    }

    // If no known asset found, extract potential asset name (usually the first part)
    if (!assetPart) {
        const words = searchTerm.trim().split(/\s+/);
        // Take first 2-4 words as potential asset name
        if (words.length >= 2) {
            assetPart = words.slice(0, Math.min(4, words.length - 1)).join(' ');
            // Try to extract ticker if it looks like one (2-5 uppercase letters)
            const potentialTicker = words.find(word => /^[A-Z]{2,5}$/.test(word));
            if (potentialTicker) {
                detectedTickers = [potentialTicker];
            }
        } else {
            assetPart = searchTerm;
        }
    }

    // Identify intent keywords in the search term
    let intentKeywordSet: string[] = [];
    for (const [category, keywords] of Object.entries(intentKeywords)) {
        for (const keyword of keywords) {
            if (termLower.includes(keyword)) {
                intentKeywordSet = keywords;
                break;
            }
        }
        if (intentKeywordSet.length > 0) break;
    }

    // If no specific intent found, use general financial keywords
    if (intentKeywordSet.length === 0) {
        intentKeywordSet = intentKeywords.general;
    }

    // Construct the boolean query
    let query = '';

    // Asset part with OR for tickers
    if (detectedTickers.length > 0) {
        const assetOptions = [`"${assetPart}"`, ...detectedTickers.map(ticker => `"${ticker}"`)];
        query += `(${assetOptions.join(' OR ')})`;
    } else {
        query += `"${assetPart}"`;
    }

    // Intent part with OR for related keywords
    const intentOptions = intentKeywordSet.slice(0, 4); // Limit to avoid too long queries
    query += ` AND (${intentOptions.join(' OR ')})`;

    // Add exclusions for better results
    query += ' -site:news.google.com -site:finance.yahoo.com/quote -site:marketwatch.com/tools';

    return query;
};

// Helper function to convert timeframe to appropriate date restriction
const getDateRestrictionFromTimeframe = (timeframe: string): string => {
    const timeframeLower = timeframe.toLowerCase();
    
    // For very short timeframes (minutes/hours), use recent news (last few days)
    if (timeframeLower.includes('m') || timeframeLower.includes('h')) {
        return 'd3'; // Last 3 days for intraday trading
    }
    
    // For daily timeframes
    if (timeframeLower === '1d') return 'd7';   // Last week
    if (timeframeLower === '3d') return 'd14';  // Last 2 weeks
    if (timeframeLower === '7d') return 'd30';  // Last month
    
    // For weekly timeframes
    if (timeframeLower === '2w') return 'd60';  // Last 2 months
    if (timeframeLower === '1m') return 'd90';  // Last 3 months
    
    // For monthly timeframes
    if (timeframeLower === '3m') return 'd180'; // Last 6 months
    if (timeframeLower === '6m') return 'd365'; // Last year
    
    // For yearly timeframes, use maximum Google allows
    if (timeframeLower.includes('y')) return 'd365'; // Last year
    
    // Default fallback
    return 'd30';
};

export const searchNews = async (searchTerms: string[], timeframe: string = '1M'): Promise<NewsArticle[]> => {
    if (!GOOGLE_CUSTOM_SEARCH_API_KEY || !NEWS_CUSTOM_SEARCH_CX) {
        console.warn("Google Custom Search API keys not configured");
        return [];
    }
    
    if (searchTerms.length === 0) {
        console.warn("No search terms provided");
        return [];
    }

    console.log("Searching news with terms:", searchTerms, "for timeframe:", timeframe);

    try {
        const allNews: NewsArticle[] = [];
        
        // Search for each term with intelligent query construction
        for (const term of searchTerms.slice(0, 3)) {
            // Parse and construct intelligent query using boolean operators
            const intelligentQuery = constructIntelligentQuery(term);
            const query = encodeURIComponent(intelligentQuery);
            
            // Add date restriction based on selected timeframe
            const dateRestrict = getDateRestrictionFromTimeframe(timeframe);
            const url = `${GOOGLE_CUSTOM_SEARCH_URL}?key=${GOOGLE_CUSTOM_SEARCH_API_KEY}&cx=${NEWS_CUSTOM_SEARCH_CX}&q=${query}&num=8&dateRestrict=${dateRestrict}&sort=date&lr=lang_en`;
            
            console.log(`Fetching news for term: "${term}" with ${dateRestrict} restriction (timeframe: ${timeframe})`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                console.error(`Failed to search news for "${term}": ${response.status} ${response.statusText}`);
                const errorText = await response.text();
                console.error("Error response:", errorText);
                continue;
            }
            
            const data = await response.json();
            console.log(`Google API response for "${term}":`, data);
            
            if (data.items && Array.isArray(data.items)) {
                const newsItems: NewsArticle[] = data.items
                    .filter((item: any) => {
                        // Filter out invalid URLs and old articles
                        const hasValidUrl = item.link && isValidNewsUrl(item.link);
                        const isRecent = isRecentArticle(item.snippet || '', item.title || '', timeframe);
                        const hasContent = item.title && item.title.length > 10;
                        
                        if (!hasValidUrl) {
                            console.log(`Filtered out invalid URL: ${item.link}`);
                        }
                        if (!isRecent) {
                            console.log(`Filtered out old article for timeframe ${timeframe}: ${item.title}`);
                        }
                        
                        return hasValidUrl && isRecent && hasContent;
                    })
                    .map((item: any) => ({
                        title: item.title || 'Untitled',
                        uri: item.link || '#',
                        snippet: item.snippet || '',
                        source: item.displayLink || 'Unknown'
                    }));
                
                allNews.push(...newsItems);
                console.log(`Added ${newsItems.length} valid articles for "${term}"`);
            } else {
                console.warn(`No news items found for "${term}"`);
            }
            
            // Add delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Remove duplicates based on title similarity and URI
        const uniqueNews = allNews.filter((article, index, self) => {
            return index === self.findIndex(a => 
                a.uri === article.uri || 
                (a.title.toLowerCase().substring(0, 50) === article.title.toLowerCase().substring(0, 50))
            );
        });
        
        // Sort by relevance (prioritize articles with more specific terms)
        const sortedNews = uniqueNews.sort((a, b) => {
            const aRelevance = searchTerms.reduce((score, term) => {
                const termLower = term.toLowerCase();
                const titleHits = (a.title.toLowerCase().match(new RegExp(termLower, 'g')) || []).length;
                const snippetHits = (a.snippet.toLowerCase().match(new RegExp(termLower, 'g')) || []).length;
                return score + titleHits * 2 + snippetHits;
            }, 0);
            
            const bRelevance = searchTerms.reduce((score, term) => {
                const termLower = term.toLowerCase();
                const titleHits = (b.title.toLowerCase().match(new RegExp(termLower, 'g')) || []).length;
                const snippetHits = (b.snippet.toLowerCase().match(new RegExp(termLower, 'g')) || []).length;
                return score + titleHits * 2 + snippetHits;
            }, 0);
            
            return bRelevance - aRelevance;
        });
        
        console.log(`Found ${sortedNews.length} unique, relevant news articles total`);
        return sortedNews.slice(0, 8); // Limit to 8 articles total
        
    } catch (error) {
        console.error("Error searching news:", error);
        return [];
    }
};
