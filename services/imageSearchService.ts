
import { GoogleGenAI } from "@google/genai";

const GOOGLE_CUSTOM_SEARCH_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
const IMAGE_CUSTOM_SEARCH_CX = process.env.IMAGE_CUSTOM_SEARCH_CX;
const GOOGLE_CUSTOM_SEARCH_URL = 'https://www.googleapis.com/customsearch/v1';

const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

if (!GOOGLE_CUSTOM_SEARCH_API_KEY || !IMAGE_CUSTOM_SEARCH_CX) {
    console.warn("Google Custom Search API keys not set for images. Using Imagen3 as primary source.");
}

export interface ImageResult {
    url: string;
    title: string;
    source: 'google' | 'imagen3';
    thumbnail?: string;
    contextLink?: string;
}

// Search Google Custom Search for images
const searchGoogleImages = async (query: string, limit: number = 5): Promise<ImageResult[]> => {
    if (!GOOGLE_CUSTOM_SEARCH_API_KEY || !IMAGE_CUSTOM_SEARCH_CX) {
        console.log('No Google API keys, returning fallback images');
        return generateFallbackImages(query, limit);
    }

    try {
        const searchQuery = encodeURIComponent(query);
        const url = `${GOOGLE_CUSTOM_SEARCH_URL}?key=${GOOGLE_CUSTOM_SEARCH_API_KEY}&cx=${IMAGE_CUSTOM_SEARCH_CX}&q=${searchQuery}&searchType=image&num=${limit}&imgType=photo&imgSize=medium&safe=active&fileType=jpg,png,gif,webp`;
        
        console.log(`Searching Google Images for: "${query}"`);
        
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Google Image search failed: ${response.status}`, errorText);
            return generateFallbackImages(query, limit);
        }

        const data = await response.json();
        if (data.items && Array.isArray(data.items)) {
            const images = data.items
                .filter((item: any) => {
                    // Filter out items without valid image URLs
                    const hasValidUrl = item.link || item.image?.thumbnailLink;
                    return hasValidUrl;
                })
                .map((item: any) => {
                    // Prefer thumbnails for better CORS compatibility
                    let imageUrl = item.image?.thumbnailLink || item.link;
                    let thumbnailUrl = item.image?.thumbnailLink;
                    
                    // Ensure we have a working URL
                    if (!imageUrl) imageUrl = item.link;
                    if (!thumbnailUrl) thumbnailUrl = item.link;
                    
                    return {
                        url: imageUrl,
                        title: item.title || 'Financial Image',
                        source: 'google' as const,
                        thumbnail: thumbnailUrl,
                        contextLink: item.image?.contextLink
                    };
                })
                .filter((image: any) => image.url); // Remove any items without URLs
            
            console.log(`Found ${images.length} valid images from Google`);
            
            // If we got results but they might have CORS issues, add fallback images
            if (images.length > 0 && images.length < limit) {
                const fallbackImages = generateFallbackImages(query, limit - images.length);
                images.push(...fallbackImages);
            }
            
            return images;
        }
    } catch (error) {
        console.error("Error searching Google Images:", error);
    }
    
    return generateFallbackImages(query, limit);
};

// Generate fallback images when Google search fails or returns no results
const generateFallbackImages = (query: string, count: number): ImageResult[] => {
    const fallbackImages: ImageResult[] = [];
    
    // Create different types of placeholder images
    const placeholderTypes = [
        { bg: '#3B82F6', icon: '📊', label: 'Chart' },
        { bg: '#10B981', icon: '💹', label: 'Trading' },
        { bg: '#8B5CF6', icon: '📈', label: 'Analysis' },
        { bg: '#F59E0B', icon: '💰', label: 'Finance' },
        { bg: '#EF4444', icon: '🏢', label: 'Company' }
    ];
    
    for (let i = 0; i < count; i++) {
        const type = placeholderTypes[i % placeholderTypes.length];
        const shortQuery = query.substring(0, 20);
        
        const svgImage = `data:image/svg+xml;base64,${btoa(`
            <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="grad${i}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${type.bg};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${type.bg}CC;stop-opacity:1" />
                    </linearGradient>
                </defs>
                <rect width="300" height="200" fill="url(#grad${i})"/>
                <text x="150" y="80" font-family="Arial, sans-serif" font-size="32" text-anchor="middle" fill="white">
                    ${type.icon}
                </text>
                <text x="150" y="110" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="white" opacity="0.9">
                    ${type.label}
                </text>
                <text x="150" y="130" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" fill="white" opacity="0.7">
                    ${shortQuery}
                </text>
            </svg>
        `)}`;
        
        fallbackImages.push({
            url: svgImage,
            title: `${type.label} - ${query}`,
            source: 'imagen3' as const
        });
    }
    
    return fallbackImages;
};

// Generate images using Imagen3 via Gemini
const generateImagen3Images = async (prompt: string, count: number = 3): Promise<ImageResult[]> => {
    if (!ai) {
        console.warn("Gemini API not available for Imagen3 generation");
        return [];
    }

    try {
        console.log(`Generating ${count} images with Imagen3 for: "${prompt}"`);
        
        const enhancedPrompt = `Create a high-quality, professional ${prompt}. Style: clean, modern, business-appropriate, high resolution, well-lit, clear details.`;
        
        // Note: This is a placeholder for Imagen3 integration
        // In practice, you would use the actual Imagen3 API through Gemini
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: `Generate a detailed description for creating an image of: ${enhancedPrompt}`,
            config: {
                temperature: 0.7,
            }
        });

        const description = response.text || prompt;
        
        // For now, return placeholder images with generated descriptions
        // In production, you would integrate with actual Imagen3 API
        const placeholderImages: ImageResult[] = [];
        for (let i = 0; i < count; i++) {
            placeholderImages.push({
                url: `https://via.placeholder.com/400x300/4f46e5/ffffff?text=${encodeURIComponent(prompt.substring(0, 20))}`,
                title: `Generated: ${prompt} (${i + 1})`,
                source: 'imagen3' as const
            });
        }
        
        console.log(`Generated ${placeholderImages.length} placeholder images (Imagen3 integration pending)`);
        return placeholderImages;
        
    } catch (error) {
        console.error("Error generating Imagen3 images:", error);
        return [];
    }
};

// Main function to search for symbol logos
export const searchSymbolLogo = async (symbol: string, companyName?: string): Promise<ImageResult[]> => {
    const searchQuery = companyName 
        ? `${companyName} ${symbol} company logo stock`
        : `${symbol} stock company logo`;
    
    console.log(`Searching for logo: ${searchQuery}`);
    
    let images: ImageResult[] = [];
    
    // Try Google Custom Search first
    const googleImages = await searchGoogleImages(searchQuery, 3);
    images.push(...googleImages);
    
    // If no results from Google, use Imagen3 as backup
    if (images.length === 0) {
        console.log("No Google results, falling back to Imagen3");
        const generatedImages = await generateImagen3Images(`${symbol} company logo`, 2);
        images.push(...generatedImages);
    }
    
    return images.slice(0, 5); // Return max 5 images
};

// Function to search for reasoning illustrations
export const searchReasoningIllustration = async (topic: string, analysisType: string): Promise<ImageResult[]> => {
    const searchQuery = `${topic} ${analysisType} financial analysis chart graph illustration`;
    
    console.log(`Searching for reasoning illustration: ${searchQuery}`);
    
    let images: ImageResult[] = [];
    
    // Try Google Custom Search first
    const googleImages = await searchGoogleImages(searchQuery, 3);
    images.push(...googleImages);
    
    // If limited results, supplement with Imagen3
    if (images.length < 2) {
        console.log("Limited Google results, supplementing with Imagen3");
        const generatedImages = await generateImagen3Images(
            `financial analysis illustration showing ${topic} ${analysisType} with charts and graphs`,
            3 - images.length
        );
        images.push(...generatedImages);
    }
    
    return images.slice(0, 3); // Return max 3 images
};

// Function to search for general financial images
export const searchFinancialImages = async (query: string): Promise<ImageResult[]> => {
    const searchQuery = `${query} financial markets trading analysis`;
    
    console.log(`Searching for financial images: ${searchQuery}`);
    
    let images: ImageResult[] = [];
    
    // Try Google Custom Search first
    const googleImages = await searchGoogleImages(searchQuery, 4);
    images.push(...googleImages);
    
    // If no results, use Imagen3
    if (images.length === 0) {
        console.log("No Google results, using Imagen3");
        const generatedImages = await generateImagen3Images(
            `professional financial illustration about ${query}`,
            3
        );
        images.push(...generatedImages);
    }
    
    return images.slice(0, 4); // Return max 4 images
};
