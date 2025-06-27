import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { AnalysisResult, HistoricalDataPoint, NewsArticle } from '../types.ts';
import { Position } from '../types.ts';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function createGeminiPrompt(assetSymbol: string, walletAmount: number, selectedIndicators: string[], historicalData: HistoricalDataPoint[]): string {
    const historicalDataString = historicalData.map(d => `${d.date}: ${d.close.toFixed(2)}`).join(", ");

    return `
    You are an expert financial analyst. Your task is to provide a trading recommendation for the asset ${assetSymbol}.
    Use Google Search to get the latest news and market sentiment for ${assetSymbol}.

    Analyze the following data to recommend a trading position (BUY, SELL, or HOLD).

    **User's Context:**
    - Trading Wallet Amount: $${walletAmount.toLocaleString()}
    - Selected Technical Indicators for Analysis: ${selectedIndicators.join(", ")}

    **Recent Historical Price Data for ${assetSymbol} (Date: Closing Price):**
    [${historicalDataString}]

    **Your Analysis Task:**
    Based on your analysis of the historical data, the selected indicators, and the real-time news from Google Search, provide the following information in a clear, structured format.

    **Do not use markdown formatting like bold or italics for the labels.**

    **START_RESPONSE**
    Recommended Position: [Strictly one of: BUY, SELL, HOLD]
    Confidence Level: [A percentage, e.g., 85%]
    Detailed Reasoning: [Provide a detailed explanation for your recommendation. Reference the historical data, the meaning of the chosen technical indicators in this context, and how the latest news influences the market sentiment. Explain if the wallet amount is suitable for the proposed position. If the recommendation is HOLD, explain what factors contribute to market uncertainty.]
    **END_RESPONSE**
    `;
}

function parseGeminiResponse(responseText: string): Omit<AnalysisResult, 'news'> {
    const positionMatch = responseText.match(/Recommended Position:\s*(BUY|SELL|HOLD)/i);
    const confidenceMatch = responseText.match(/Confidence Level:\s*([\d\.]+%?)/);
    const reasoningMatch = responseText.match(/Detailed Reasoning:\s*([\s\S]*)/);
    
    // Extract the reasoning block more reliably
    const reasoningText = reasoningMatch ? reasoningMatch[1].trim() : "No detailed reasoning provided.";

    const positionStr = positionMatch ? positionMatch[1].toUpperCase() : 'N/A';
    const position = Object.values(Position).includes(positionStr as Position) ? positionStr as Position : Position.NA;

    return {
        position,
        confidence: confidenceMatch ? confidenceMatch[1] : 'N/A',
        reasoning: reasoningText,
    };
}

export const getTradingPosition = async (
    assetSymbol: string,
    walletAmount: number,
    selectedIndicators: string[],
    historicalData: HistoricalDataPoint[]
): Promise<AnalysisResult> => {
    const prompt = createGeminiPrompt(assetSymbol, walletAmount, selectedIndicators, historicalData);

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.3,
            }
        });

        const responseText = response.text;
        
        if (!responseText) {
            throw new Error("Received an empty response from Gemini API.");
        }

        const parsedResult = parseGeminiResponse(responseText);
        
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        const news: NewsArticle[] = groundingMetadata?.groundingChunks
            ?.map((chunk: any) => ({
                title: chunk.web?.title || 'Untitled',
                uri: chunk.web?.uri || '#',
            }))
            .filter(article => article.uri !== '#') ?? [];

        return {
            ...parsedResult,
            news,
        };

    } catch (error) {
        console.error("Gemini API call failed:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while contacting the Gemini API.");
    }
};