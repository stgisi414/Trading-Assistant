
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
        return [];
    }

    try {
        const searchQuery = encodeURIComponent(query);
        const url = `${GOOGLE_CUSTOM_SEARCH_URL}?key=${GOOGLE_CUSTOM_SEARCH_API_KEY}&cx=${IMAGE_CUSTOM_SEARCH_CX}&q=${searchQuery}&searchType=image&num=${limit}&imgType=photo&imgSize=medium&safe=active`;
        
        console.log(`Searching Google Images for: "${query}"`);
        
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Google Image search failed: ${response.status}`);
            return [];
        }

        const data = await response.json();
        if (data.items && Array.isArray(data.items)) {
            const images = data.items.map((item: any) => ({
                url: item.link || item.image?.thumbnailLink,
                title: item.title || 'Untitled',
                source: 'google' as const,
                thumbnail: item.image?.thumbnailLink,
                contextLink: item.image?.contextLink
            }));
            
            console.log(`Found ${images.length} images from Google`);
            return images;
        }
    } catch (error) {
        console.error("Error searching Google Images:", error);
    }
    
    return [];
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
