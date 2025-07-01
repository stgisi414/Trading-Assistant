I will modify the `getTradingPosition` function to accept a `tenKAnalysis` parameter and include its data in the Gemini prompt. Also, I will include `tenKAnalysis` in the response structure.
```
```replit_final_file
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Position } from '../types.ts';
import type { AnalysisResult, HistoricalDataPoint, NewsArticle, OpenInterestAnalysis, OptionsAnalysis, OptionRecommendation, OrderAnalysis, LimitOrder } from '../types.ts';
import { calculateTechnicalIndicators, type TechnicalIndicatorValues } from './technicalIndicators.ts';
import { searchNews } from './newsSearchService.ts';
import { searchSymbolLogo, searchReasoningIllustration } from './imageSearchService.ts';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

function createSearchTermsPrompt(assetSymbol: string): string {
    return `
    You are a financial research assistant. Generate 3-4 search terms to find recent news and analysis about ${assetSymbol}.

    Create search terms that are:
    - Simple and broad enough for news search engines
    - Use company names AND stock symbols
    - Focus on recent financial events and analysis
    - Suitable for both news sites and financial analysis platforms

    Good examples for AAPL: "Apple earnings", "AAPL stock", "Apple financial results", "Apple quarterly report"
    Good examples for TSLA: "Tesla earnings", "TSLA stock", "Tesla financial", "Tesla quarterly"
    Good examples for AI: "C3.ai earnings", "AI stock", "C3.ai financial", "artificial intelligence stocks"

    Avoid overly specific phrases like "earnings call transcript" or "detailed financial analysis".
    Keep terms concise and news-friendly.

    Return only the search terms, one per line, without quotes or additional formatting.

    Asset Symbol: ${assetSymbol}
    `;
}

function createEnhancedGeminiPrompt(
    assetSymbol: string, 
    walletAmount: number, 
    selectedIndicators: string[], 
    historicalData: HistoricalDataPoint[],
    newsArticles: NewsArticle[],
    technicalIndicatorValues: TechnicalIndicatorValues
): string {
    // Ensure historicalData is always an array and has valid data
    const dataArray = Array.isArray(historicalData) ? historicalData : [];
    const historicalDataString = dataArray.length > 0 
        ? dataArray.map(d => `${d.date}: ${d.close?.toFixed(2) || 'N/A'}`).join(", ")
        : "No historical data available";
    const newsString = newsArticles.length > 0 
        ? newsArticles.map(article => `Title: ${article.title}\nSource: ${article.source || 'Unknown'}\nSummary: ${article.snippet || 'No summary available'}\nURL: ${article.uri}`).join("\n\n")
        : "No recent news articles found.";

    // Enhanced structured prompting for indicator confluence
    const indicatorCategories = {
        trend: ['SMA', 'EMA', 'MACD', 'ADX'].filter(i => selectedIndicators.includes(i)),
        momentum: ['RSI', 'StochasticOscillator'].filter(i => selectedIndicators.includes(i)),
        volatility: ['BollingerBands', 'Volatility'].filter(i => selectedIndicators.includes(i)),
        volume: ['Volume'].filter(i => selectedIndicators.includes(i))
    };

    const confluenceStructure = `
    **INDICATOR CONFLUENCE ANALYSIS FRAMEWORK:**
    Your analysis MUST establish equilibrium through systematic confluence evaluation:

    1. TREND INDICATORS (${indicatorCategories.trend.join(', ') || 'None'}): Primary directional bias
    2. MOMENTUM INDICATORS (${indicatorCategories.momentum.join(', ') || 'None'}): Entry/exit timing
    3. VOLATILITY INDICATORS (${indicatorCategories.volatility.join(', ') || 'None'}): Risk assessment
    4. VOLUME INDICATORS (${indicatorCategories.volume.join(', ') || 'None'}): Conviction validation

    **CONFLUENCE SCORING METHODOLOGY:**
    - Assign each indicator category a score: BULLISH (+2), NEUTRAL (0), BEARISH (-2)
    - Calculate Confluence Score: Sum of all category scores
    - Confluence Equilibrium: Score between -1 and +1 indicates HOLD
    - Strong Confluence: Score ≥ +4 indicates BUY, Score ≤ -4 indicates SELL
    - Moderate Confluence: Score 2-3 indicates weak BUY, Score -2 to -3 indicates weak SELL
    `;

    return `
    You are an expert quantitative analyst specializing in multi-indicator confluence analysis. Your task is to provide a systematic, equilibrium-based trading recommendation for ${assetSymbol}.

    ${confluenceStructure}

    **MARKET DATA CONTEXT:**
    - Asset Symbol: ${assetSymbol}
    - Trading Capital: $${walletAmount.toLocaleString()}
    - Active Indicators: ${selectedIndicators.join(", ")}
    - Analysis Timeframe: Based on historical data patterns

    **PRICE DATA SERIES:**
    ${historicalDataString}

    **NEWS SENTIMENT DATA:**
    ${newsString}

    **TECHNICAL INDICATOR READINGS:**
    - SMA Signals: ${technicalIndicatorValues.sma ? technicalIndicatorValues.sma.map(s => `${s.period}p: $${s.value.toFixed(2)} (${s.trend})`).join(', ') : 'Not calculated'}
    - EMA Signals: ${technicalIndicatorValues.ema ? technicalIndicatorValues.ema.map(e => `${e.period}p: $${e.value.toFixed(2)} (${e.trend})`).join(', ') : 'Not calculated'}
    - RSI Reading: ${technicalIndicatorValues.rsi ? `${technicalIndicatorValues.rsi.value.toFixed(2)} (${technicalIndicatorValues.rsi.signal})` : 'Not calculated'}
    - MACD Analysis: ${technicalIndicatorValues.macd ? `Line: ${technicalIndicatorValues.macd.macd.toFixed(2)}, Signal: ${technicalIndicatorValues.macd.signal.toFixed(2)}, Histogram: ${technicalIndicatorValues.macd.histogram.toFixed(2)} (${technicalIndicatorValues.macd.trend})` : 'Not calculated'}
    - Bollinger Position: ${technicalIndicatorValues.bollingerBands ? `Price vs Bands: ${technicalIndicatorValues.bollingerBands.position}, Upper: $${technicalIndicatorValues.bollingerBands.upper.toFixed(2)}, Lower: $${technicalIndicatorValues.bollingerBands.lower.toFixed(2)}` : 'Not calculated'}
    - Stochastic Status: ${technicalIndicatorValues.stochasticOscillator ? `%K: ${technicalIndicatorValues.stochasticOscillator.k.toFixed(2)}, %D: ${technicalIndicatorValues.stochasticOscillator.d.toFixed(2)} (${technicalIndicatorValues.stochasticOscillator.signal})` : 'Not calculated'}
    - ADX Strength: ${technicalIndicatorValues.adx ? `${technicalIndicatorValues.adx.value.toFixed(2)} (${technicalIndicatorValues.adx.trend})` : 'Not calculated'}
    - Volume Profile: ${technicalIndicatorValues.volume ? `Current: ${technicalIndicatorValues.volume.current.toLocaleString()}, Average: ${technicalIndicatorValues.volume.average.toLocaleString()} (${technicalIndicatorValues.volume.trend})` : 'Not calculated'}
    - Volatility Measure: ${technicalIndicatorValues.volatility ? `${technicalIndicatorValues.volatility.value.toFixed(2)}% (${technicalIndicatorValues.volatility.level})` : 'Not calculated'}

    **STRUCTURED ANALYSIS REQUIREMENTS:**

    **START_RESPONSE**
    Recommended Position: [BUY/SELL/HOLD]
    Confidence Level: [Percentage based on confluence strength]
    Confluence Score: [Numerical score from methodology above]

    Detailed Reasoning:

    **CONFLUENCE EQUILIBRIUM ANALYSIS:**

    **Phase 1: Indicator Category Scoring**
    - Trend Category Score: [+2/0/-2] based on ${indicatorCategories.trend.join(', ') || 'N/A'}
    - Momentum Category Score: [+2/0/-2] based on ${indicatorCategories.momentum.join(', ') || 'N/A'}
    - Volatility Category Score: [+2/0/-2] based on ${indicatorCategories.volatility.join(', ') || 'N/A'}
    - Volume Category Score: [+2/0/-2] based on ${indicatorCategories.volume.join(', ') || 'N/A'}

    **Phase 2: Individual Indicator Deep Dive**
    For each selected indicator (${selectedIndicators.join(", ")}):
    - Current signal state and numerical reading
    - Timeframe reliability and signal strength
    - Confluence contribution to overall equilibrium
    - Potential divergences or confirmations with other indicators

    **Phase 3: Multi-Timeframe Confluence Validation**
    - Short-term momentum vs long-term trend alignment
    - Volume confirmation of price movements
    - Volatility expansion/contraction patterns
    - Support/resistance level interactions

    **Phase 4: Risk-Adjusted Position Synthesis**
    - Confluence-based position sizing for $${walletAmount.toLocaleString()} capital
    - Entry/exit optimization based on indicator alignment
    - Risk management parameters derived from volatility measures
    - Scenario analysis for confluence breakdown points

    **Phase 5: Market Context Integration**
    - News sentiment impact on technical confluence
    - Sector/market correlation effects
    - Economic calendar considerations
    - Liquidity and volume profile assessment

    **FINAL EQUILIBRIUM VERDICT:**
    Comprehensive conclusion integrating all confluence factors with specific price targets and risk parameters.
    **END_RESPONSE**
    `;
}

function parseGeminiResponse(responseText: string): Omit<AnalysisResult, 'news'> {
    console.log("Raw Gemini response:", responseText);

    // Try multiple parsing approaches
    const positionMatch = responseText.match(/Recommended Position:\s*(BUY|SELL|HOLD)/i) ||
                         responseText.match(/Position:\s*(BUY|SELL|HOLD)/i) ||
                         responseText.match(/(BUY|SELL|HOLD)/i);

    const confidenceMatch = responseText.match(/Confidence Level:\s*([\d\.]+%?)/i) ||
                           responseText.match(/Confidence:\s*([\d\.]+%?)/i) ||
                           responseText.match(/([\d\.]+)%/);

    const reasoningMatch = responseText.match(/Detailed Reasoning:\s*([\s\S]*?)(?:\*\*END_RESPONSE\*\*|$)/i) ||
                          responseText.match(/Reasoning:\s*([\s\S]*?)(?:\*\*END_RESPONSE\*\*|$)/i) ||
                          responseText.match(/Analysis:\s*([\s\S]*?)(?:\*\*END_RESPONSE\*\*|$)/i);

    let reasoningText = "No detailed reasoning provided.";
    if (reasoningMatch && reasoningMatch[1]) {
        reasoningText = reasoningMatch[1].trim();
        // If reasoning is too short, use the entire response
        if (reasoningText.length < 50) {
            reasoningText = responseText.trim();
        }
    } else if (responseText.length > 100) {
        // Use entire response if no specific reasoning found but response is substantial
        reasoningText = responseText.trim();
    }

    const positionStr = positionMatch ? positionMatch[1].toUpperCase() : 'HOLD';
    const position = Object.values(Position).includes(positionStr as Position) ? positionStr as Position : Position.HOLD;

    const confidence = confidenceMatch ? confidenceMatch[1] : '50%';

    console.log("Parsed result:", { position, confidence, reasoning: reasoningText.substring(0, 100) + "..." });

    return {
        position,
        confidence,
        reasoning: reasoningText,
    };
}

export const generateSearchTerms = async (assetSymbol: string): Promise<string[]> => {
    const prompt = createSearchTermsPrompt(assetSymbol);

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
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
    symbol: string,
    walletAmount: number,
    selectedIndicators: string[],
    historicalData: HistoricalDataPoint[],
    newsArticles: NewsArticle[] = [],
    openInterestAnalysis?: OpenInterestAnalysis,
    includeOptionsAnalysis: boolean = false,
    includeCallOptions: boolean = true,
    includePutOptions: boolean = true,
    timeframe: string = "1d",
    tenKAnalysis?: any
): Promise<AnalysisResult> => {
    try {
        // Ensure historicalData is always an array
        const dataArray = Array.isArray(historicalData) ? historicalData : [];
        const lastTenDataPoints = dataArray.length > 0 ? dataArray.slice(-10) : [];

        const newsString = newsArticles && newsArticles.length > 0 
            ? newsArticles.map((article, index) => `${index + 1}. ${article.title}\n   Source: ${article.source || 'Unknown'}\n   Summary: ${article.snippet || 'No summary available'}\n   URL: ${article.uri}`).join('\n\n')
            : 'No recent news articles found.';

         // Calculate technical indicators
        const technicalIndicatorValues = calculateTechnicalIndicators(lastTenDataPoints, selectedIndicators);


        let prompt = `You are an expert financial analyst. Provide a comprehensive trading recommendation for ${symbol}.

ANALYSIS DATA:
- Asset Symbol: ${symbol}
- Trading Wallet: $${walletAmount.toLocaleString()}
- Technical Indicators: ${selectedIndicators.join(', ')}
- Historical Data Points: ${dataArray.length}

RECENT PRICE DATA:
${lastTenDataPoints.map(d => `${d.date}: $${d.close?.toFixed(2) || 'N/A'} (Volume: ${d.volume?.toLocaleString() || 'N/A'})`).join('\n')}

RECENT NEWS:
${newsString}

${openInterestAnalysis ? `

        **Open Interest Analysis:**
        - Current Open Interest: ${openInterestAnalysis.currentOpenInterest}
        - Trend: ${openInterestAnalysis.openInterestTrend}
        - Speculative Ratio: ${openInterestAnalysis.speculativeRatio}
        - Market Sentiment: ${openInterestAnalysis.marketSentiment}
        - Analysis: ${openInterestAnalysis.analysis}
        ` : ''}

        ${tenKAnalysis ? `

        **10-K Fundamental Analysis:**
        - Report Year: ${tenKAnalysis.reportYear}
        - Revenue: $${(tenKAnalysis.financialHighlights.revenue / 1000000).toFixed(1)}M
        - Net Income: $${(tenKAnalysis.financialHighlights.netIncome / 1000000).toFixed(1)}M
        - EPS: $${tenKAnalysis.financialHighlights.eps.toFixed(2)}
        - ROE: ${(tenKAnalysis.financialHighlights.roe * 100).toFixed(1)}%
        - Debt/Equity: ${tenKAnalysis.financialHighlights.debtToEquity.toFixed(2)}
        - Profit Margin: ${(tenKAnalysis.keyMetrics.profitMargin * 100).toFixed(1)}%
        - Business Overview: ${tenKAnalysis.businessOverview}
        - Investment Recommendation: ${tenKAnalysis.investmentRecommendation}
        - Key Risk Factors: ${tenKAnalysis.riskFactors.join(', ')}
        ` : ''}

PROVIDE YOUR ANALYSIS IN THIS EXACT FORMAT:

Recommended Position: [BUY/SELL/HOLD]
Confidence Level: [percentage, e.g., 75%]
Detailed Reasoning: [Your comprehensive analysis incorporating price trends, technical indicators, news sentiment, and market conditions. Explain your reasoning clearly and reference specific data points.]`;

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

        const enhancedPrompt = createEnhancedGeminiPrompt(
            symbol,
            walletAmount,
            selectedIndicators,
            historicalData,
            newsArticles,
            technicalIndicatorValues
        );

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: enhancedPrompt,
            config: {
                temperature: 0.3,
            }
        });

        const responseText = response.text;

        if (!responseText) {
            throw new Error("Received an empty response from Gemini API.");
        }

        const parsedResult = parseGeminiResponse(responseText);

        // Search for symbol logo and reasoning illustrations
        let symbolLogo: any[] = [];
        let reasoningIllustrations: any[] = [];

        try {
            // Search for company logo
            symbolLogo = await searchSymbolLogo(symbol);

            // Search for reasoning illustrations based on the analysis
            const analysisKeywords = `${symbol} ${parsedResult.position.toLowerCase()} analysis`;
            reasoningIllustrations = await searchReasoningIllustration(analysisKeywords, 'technical analysis');

            console.log(`Found ${symbolLogo.length} logo images and ${reasoningIllustrations.length} reasoning illustrations`);
        } catch (imageError) {
            console.warn("Failed to fetch images for analysis:", imageError);
        }

        return {
            ...parsedResult,
            news: newsArticles || [],
            symbolLogo,
            reasoningIllustrations,
            optionsAnalysis,
            orderAnalysis,
            openInterestAnalysis,
            tenKAnalysis
        };

    } catch (error) {
        console.error("Gemini API call failed:", error);
        if (error instanceof Error) {
            throw new Error(`Gemini API Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred while contacting the Gemini API.");
    }
};