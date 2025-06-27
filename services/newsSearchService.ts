
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

// Helper function to check if article is recent (within last 30 days)
const isRecentArticle = (snippet: string, title: string): boolean => {
    const text = (snippet + ' ' + title).toLowerCase();
    const oldDatePatterns = [
        /202[0-2]/, // Years 2020-2022
        /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+202[0-2]/,
        /\d{1,2}\/\d{1,2}\/202[0-2]/,
        /202[0-2]-\d{2}-\d{2}/
    ];
    
    return !oldDatePatterns.some(pattern => pattern.test(text));
};

export const searchNews = async (searchTerms: string[]): Promise<NewsArticle[]> => {
    if (!GOOGLE_CUSTOM_SEARCH_API_KEY || !NEWS_CUSTOM_SEARCH_CX) {
        console.warn("Google Custom Search API keys not configured");
        return [];
    }
    
    if (searchTerms.length === 0) {
        console.warn("No search terms provided");
        return [];
    }

    console.log("Searching news with terms:", searchTerms);

    try {
        const allNews: NewsArticle[] = [];
        
        // Search for each term with improved query construction
        for (const term of searchTerms.slice(0, 3)) {
            // Construct better search query for financial news
            const enhancedQuery = `"${term}" (news OR earnings OR announcement OR financial OR stock OR shares) -site:news.google.com -site:finance.yahoo.com/quote`;
            const query = encodeURIComponent(enhancedQuery);
            
            // Add date restriction to last 30 days and sort by date
            const dateRestrict = 'd30'; // Last 30 days
            const url = `${GOOGLE_CUSTOM_SEARCH_URL}?key=${GOOGLE_CUSTOM_SEARCH_API_KEY}&cx=${NEWS_CUSTOM_SEARCH_CX}&q=${query}&num=8&dateRestrict=${dateRestrict}&sort=date&lr=lang_en`;
            
            console.log(`Fetching recent news for term: "${term}"`);
            
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
                        const isRecent = isRecentArticle(item.snippet || '', item.title || '');
                        const hasContent = item.title && item.title.length > 10;
                        
                        if (!hasValidUrl) {
                            console.log(`Filtered out invalid URL: ${item.link}`);
                        }
                        if (!isRecent) {
                            console.log(`Filtered out old article: ${item.title}`);
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
