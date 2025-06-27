import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { AnalysisResult, HistoricalDataPoint, NewsArticle } from '../types.ts';
import { Position } from '../types.ts';
import { searchNews } from './newsSearchService.ts';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function createSearchTermsPrompt(assetSymbol: string): string {
    return `
    You are a financial research assistant. Generate 3-5 relevant search terms to find recent news articles about ${assetSymbol}.

    The search terms should help find:
    - Recent company news and announcements
    - Financial performance and earnings
    - Market sentiment and analyst opinions
    - Industry trends affecting the company
    - Regulatory or economic factors

    Return only the search terms, one per line, without any additional formatting or explanations.
    Focus on terms that would yield high-quality financial news results.

    Asset Symbol: ${assetSymbol}
    `;
}

function createEnhancedGeminiPrompt(
    assetSymbol: string, 
    walletAmount: number, 
    selectedIndicators: string[], 
    historicalData: HistoricalDataPoint[],
    newsArticles: NewsArticle[]
): string {
    // Ensure historicalData is always an array and has valid data
    const dataArray = Array.isArray(historicalData) ? historicalData : [];
    const historicalDataString = dataArray.length > 0 
        ? dataArray.map(d => `${d.date}: ${d.close?.toFixed(2) || 'N/A'}`).join(", ")
        : "No historical data available";
    const newsString = newsArticles.length > 0 
        ? newsArticles.map(article => `Title: ${article.title}\nSource: ${article.source || 'Unknown'}\nSummary: ${article.snippet || 'No summary available'}\nURL: ${article.uri}`).join("\n\n")
        : "No recent news articles found.";

    return `
    You are an expert financial analyst. Your task is to provide a comprehensive trading recommendation for the asset ${assetSymbol}.

    Analyze the following data to recommend a trading position (BUY, SELL, or HOLD).

    **User's Context:**
    - Trading Wallet Amount: $${walletAmount.toLocaleString()}
    - Selected Technical Indicators for Analysis: ${selectedIndicators.join(", ")}

    **Recent Historical Price Data for ${assetSymbol} (Date: Closing Price):**
    [${historicalDataString}]

    **Recent News Articles:**
    ${newsString}

    **Your Analysis Task:**
    Based on your comprehensive analysis of the historical data, selected indicators, and recent news sentiment, provide the following information in a clear, structured format.

    **Do not use markdown formatting like bold or italics for the labels.**

    **START_RESPONSE**
    Recommended Position: [Strictly one of: BUY, SELL, HOLD]
    Confidence Level: [A percentage, e.g., 85%]
    Detailed Reasoning: [Provide a detailed explanation for your recommendation. Reference the historical price trends, the meaning of the chosen technical indicators in this context, and how the recent news sentiment influences the market outlook. Explain if the wallet amount is suitable for the proposed position. If the recommendation is HOLD, explain what factors contribute to market uncertainty. Cite specific news articles when relevant to your analysis.]
    **END_RESPONSE**
    `;
}

function parseGeminiResponse(responseText: string): Omit<AnalysisResult, 'news'> {
    const positionMatch = responseText.match(/Recommended Position:\s*(BUY|SELL|HOLD)/i);
    const confidenceMatch = responseText.match(/Confidence Level:\s*([\d\.]+%?)/);
    const reasoningMatch = responseText.match(/Detailed Reasoning:\s*([\s\S]*)/);

    const reasoningText = reasoningMatch ? reasoningMatch[1].trim() : "No detailed reasoning provided.";

    const positionStr = positionMatch ? positionMatch[1].toUpperCase() : 'N/A';
    const position = Object.values(Position).includes(positionStr as Position) ? positionStr as Position : Position.NA;

    return {
        position,
        confidence: confidenceMatch ? confidenceMatch[1] : 'N/A',
        reasoning: reasoningText,
    };
}

export const generateSearchTerms = async (assetSymbol: string): Promise<string[]> => {
    const prompt = createSearchTermsPrompt(assetSymbol);

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: {
                temperature: 0.3,
            }
        });

        const responseText = response.text;

        if (!responseText) {
            console.warn("No search terms generated, using default terms");
            return [`${assetSymbol} news`, `${assetSymbol} earnings`, `${assetSymbol} stock`];
        }

        const searchTerms = responseText
            .split('\n')
            .map(term => term.trim())
            .filter(term => term.length > 0)
            .slice(0, 5); // Limit to 5 terms

        return searchTerms.length > 0 ? searchTerms : [`${assetSymbol} news`, `${assetSymbol} earnings`, `${assetSymbol} stock`];

    } catch (error) {
        console.error("Error generating search terms:", error);
        return [`${assetSymbol} news`, `${assetSymbol} earnings`, `${assetSymbol} stock`];
    }
};

export const getTradingPosition = async (
    assetSymbol: string,
    historicalData: HistoricalDataPoint[],
    walletAmount: number,
    selectedIndicators: string[],
    newsArticles: NewsArticle[] = [],
    openInterestAnalysis?: any,
    includeOptionsAnalysis?: boolean,
    includeCallOptions?: boolean,
    includePutOptions?: boolean
): Promise<AnalysisResult> => {
    try {
        // Ensure historicalData is always an array
        const dataArray = Array.isArray(historicalData) ? historicalData : [];
        const lastTenDataPoints = dataArray.length > 0 ? dataArray.slice(-10) : [];
        
        let prompt = `You are a professional trading analyst. Analyze the following stock data for ${assetSymbol} and provide a trading recommendation.

        Historical Data (last ${dataArray.length} data points):
        ${JSON.stringify(lastTenDataPoints, null, 2)}

        Current wallet amount: $${walletAmount}
        Technical indicators to analyze: ${selectedIndicators.join(', ')}

        ${openInterestAnalysis ? `
        Open Interest Analysis:
        - Current Open Interest: ${openInterestAnalysis.currentOpenInterest?.toLocaleString()} contracts
        - Trend: ${openInterestAnalysis.openInterestTrend}
        - Speculative Ratio: ${openInterestAnalysis.speculativeRatio?.toFixed(2)}
        - Market Sentiment: ${openInterestAnalysis.marketSentiment}
        - Analysis: ${openInterestAnalysis.analysis}
        ` : ''}

        Recent news articles:
        ${newsArticles && newsArticles.length > 0 ? newsArticles.map((article, index) => `${index + 1}. ${article.title} - ${article.snippet || 'No snippet available'}`).join('\n') : 'No news articles available'}
        `;

        if (includeOptionsAnalysis && (includeCallOptions || includePutOptions)) {
            prompt += `\n\nPROVIDE OPTIONS ANALYSIS:
Based on the current price trends and analysis, recommend specific options trades using bid/ask pricing:`;

            if (includeCallOptions) {
                prompt += `
- Call Options: Suggest strike prices, expiration dates, bid/ask prices, and spread analysis for bullish strategies`;
            }

            if (includePutOptions) {
                prompt += `
- Put Options: Suggest strike prices, expiration dates, bid/ask prices, and spread analysis for bearish/protective strategies`;
            }

            prompt += `

Consider bid/ask spreads in your recommendations - tighter spreads indicate better liquidity.
Format the options analysis as a JSON object with this structure:
{
  "optionsAnalysis": {
    "callRecommendation": {
      "strike": number,
      "expiration": "YYYY-MM-DD",
      "premium": number,
      "bid": number,
      "ask": number,
      "spread": number,
      "reasoning": "explanation including spread analysis"
    },
    "putRecommendation": {
      "strike": number, 
      "expiration": "YYYY-MM-DD",
      "premium": number,
      "bid": number,
      "ask": number,
      "spread": number,
      "reasoning": "explanation including spread analysis"
    }
  }
}`;
        }

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: {
                temperature: 0.3,
            }
        });

        const responseText = response.text;

        if (!responseText) {
            throw new Error("Received an empty response from Gemini API.");
        }

        const parsedResult = parseGeminiResponse(responseText);

        return {
            ...parsedResult,
            news: newsArticles || [],
        };

    } catch (error) {
        console.error("Gemini API call failed:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while contacting the Gemini API.");
    }
};