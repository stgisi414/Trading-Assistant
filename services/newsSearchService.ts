
import type { NewsArticle } from '../types.ts';

const GOOGLE_CUSTOM_SEARCH_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
const NEWS_CUSTOM_SEARCH_CX = process.env.NEWS_CUSTOM_SEARCH_CX;
const GOOGLE_CUSTOM_SEARCH_URL = 'https://www.googleapis.com/customsearch/v1';

if (!GOOGLE_CUSTOM_SEARCH_API_KEY || !NEWS_CUSTOM_SEARCH_CX) {
    console.warn("Google Custom Search API keys not set. News search will be disabled.");
}

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
        
        // Search for each term (limit to avoid API quota issues)
        for (const term of searchTerms.slice(0, 3)) {
            const query = encodeURIComponent(term);
            const url = `${GOOGLE_CUSTOM_SEARCH_URL}?key=${GOOGLE_CUSTOM_SEARCH_API_KEY}&cx=${NEWS_CUSTOM_SEARCH_CX}&q=${query}&num=5&sort=date`;
            
            console.log(`Fetching news for term: "${term}"`);
            
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
                const newsItems: NewsArticle[] = data.items.map((item: any) => ({
                    title: item.title || 'Untitled',
                    uri: item.link || '#',
                    snippet: item.snippet || '',
                    source: item.displayLink || 'Unknown'
                }));
                
                allNews.push(...newsItems);
                console.log(`Added ${newsItems.length} articles for "${term}"`);
            } else {
                console.warn(`No news items found for "${term}"`);
            }
        }
        
        // Remove duplicates based on URI
        const uniqueNews = allNews.filter((article, index, self) => 
            index === self.findIndex(a => a.uri === article.uri)
        );
        
        console.log(`Found ${uniqueNews.length} unique news articles total`);
        return uniqueNews.slice(0, 10); // Limit to 10 articles total
        
    } catch (error) {
        console.error("Error searching news:", error);
        return [];
    }
};
