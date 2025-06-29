
import { getTradingPosition, generateSearchTerms } from './geminiService.ts';
import { fetchHistoricalData, searchSymbols } from './marketDataService.ts';
import { searchNews } from './newsSearchService.ts';
import { INDICATOR_OPTIONS, TIMEFRAME_OPTIONS, MARKET_OPTIONS } from '../constants.ts';
import type { FmpSearchResult, AnalysisResult, HistoricalDataPoint, AssetAnalysis } from '../types.ts';
import { Position, MarketType } from '../types.ts';

export interface ProfitMaxConfig {
    tier: 'light' | 'pro' | 'ultra';
    userSelectedIndicators: string[];
    marketType: MarketType;
    market: string;
    initialWalletAmount: number;
    maxSymbols: number;
    targetProfitPercentage?: number;
}

export interface OptimizationResult {
    bestSymbols: FmpSearchResult[];
    bestWalletAmount: number;
    bestIndicators: string[];
    bestTimeframe: string;
    expectedProfitPercentage: number;
    confidence: number;
    optimizationDetails: {
        symbolsAnalyzed: number;
        timeframesAnalyzed: number;
        indicatorCombinationsAnalyzed: number;
        walletAmountsAnalyzed: number;
        totalAnalyses: number;
    };
    analyses: AssetAnalysis[];
}

interface OptimizationCandidate {
    symbols: FmpSearchResult[];
    walletAmount: number;
    indicators: string[];
    timeframe: string;
    expectedProfit: number;
    confidence: number;
    analyses: AssetAnalysis[];
}

const TIER_CONFIGS = {
    light: {
        maxSymbolsToTest: 5,
        maxTimeframesToTest: 1,
        maxIndicatorCombinations: 1,
        maxWalletAmounts: 1,
        maxTotalCombinations: 5,
        description: 'Quick optimization (~2-5 minutes)'
    },
    pro: {
        maxSymbolsToTest: 8,
        maxTimeframesToTest: 2,
        maxIndicatorCombinations: 2,
        maxWalletAmounts: 2,
        maxTotalCombinations: 10,
        description: 'Comprehensive optimization (~5-10 minutes)'
    },
    ultra: {
        maxSymbolsToTest: 10,
        maxTimeframesToTest: 3,
        maxIndicatorCombinations: 3,
        maxWalletAmounts: 2,
        maxTotalCombinations: 15,
        description: 'Maximum optimization (~10-15 minutes)'
    }
};

const generateSymbolCandidates = async (marketType: MarketType, market: string, maxSymbols: number): Promise<FmpSearchResult[]> => {
    const candidates: FmpSearchResult[] = [];
    
    // Get symbols from market options
    const marketData = MARKET_OPTIONS[marketType]?.find(m => m.value === market);
    if (marketData?.symbols) {
        candidates.push(...marketData.symbols.map(s => ({ symbol: s.symbol, name: s.name })));
    }
    
    // For stocks, search for additional high-volume candidates
    if (marketType === MarketType.STOCKS) {
        const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX', 'SPY', 'QQQ', 'IWM', 'XLF', 'XLE', 'XLK'];
        for (const symbol of popularSymbols) {
            if (!candidates.find(c => c.symbol === symbol)) {
                candidates.push({ symbol, name: `${symbol} - Popular Stock` });
            }
        }
    }
    
    return candidates.slice(0, maxSymbols);
};

const generateIndicatorCombinations = (userSelected: string[], maxCombinations: number): string[][] => {
    const combinations: string[][] = [];
    
    // Always include user selected indicators as base
    combinations.push(userSelected);
    
    // Add high-performing indicator combinations
    const highPerformingCombos = [
        ['SMA', 'RSI', 'Volume'],
        ['EMA', 'MACD', 'Volume'],
        ['RSI', 'BollingerBands', 'Volume'],
        ['SMA', 'EMA', 'RSI', 'Volume'],
        ['MACD', 'StochasticOscillator', 'Volume'],
        ['ADX', 'RSI', 'BollingerBands'],
        ['SMA', 'EMA', 'MACD', 'RSI'],
        ['HeadAndShouldersTop', 'DoubleTop', 'Volume'],
        ['BollingerBands', 'StochasticOscillator', 'ADX'],
        ['OpenInterest', 'Volume', 'RSI']
    ];
    
    for (const combo of highPerformingCombos) {
        if (combinations.length >= maxCombinations) break;
        if (!combinations.some(existing => 
            existing.length === combo.length && 
            existing.every(ind => combo.includes(ind))
        )) {
            combinations.push(combo);
        }
    }
    
    return combinations.slice(0, maxCombinations);
};

const generateWalletAmounts = (initialAmount: number, maxAmounts: number): number[] => {
    const amounts = [initialAmount];
    const multipliers = [0.5, 0.75, 1.25, 1.5, 2, 3, 5, 10];
    
    for (const multiplier of multipliers) {
        if (amounts.length >= maxAmounts) break;
        const amount = initialAmount * multiplier;
        if (amount >= 1000 && amount <= 1000000 && !amounts.includes(amount)) {
            amounts.push(amount);
        }
    }
    
    return amounts.slice(0, maxAmounts);
};

const calculateProfitPotential = (analyses: AssetAnalysis[]): { profit: number; confidence: number } => {
    let totalProfit = 0;
    let totalConfidence = 0;
    let validAnalyses = 0;
    
    for (const analysis of analyses) {
        if (analysis.analysisResult && analysis.analysisResult.position !== Position.HOLD) {
            const confidenceNum = parseFloat(analysis.analysisResult.confidence.replace('%', ''));
            const profitMultiplier = analysis.analysisResult.position === Position.BUY ? 1 : -0.5;
            
            // Estimate profit based on position confidence and historical volatility
            const recentData = analysis.historicalData.slice(-10);
            if (recentData.length >= 2) {
                const priceChange = ((recentData[recentData.length - 1].close - recentData[0].close) / recentData[0].close) * 100;
                const volatility = Math.abs(priceChange);
                const estimatedProfit = (confidenceNum / 100) * volatility * profitMultiplier;
                
                totalProfit += estimatedProfit;
                totalConfidence += confidenceNum;
                validAnalyses++;
            }
        }
    }
    
    return {
        profit: validAnalyses > 0 ? totalProfit / validAnalyses : 0,
        confidence: validAnalyses > 0 ? totalConfidence / validAnalyses : 0
    };
};

const analyzeSymbolsWithConfig = async (
    symbols: FmpSearchResult[],
    walletAmount: number,
    indicators: string[],
    timeframe: string
): Promise<AssetAnalysis[]> => {
    const analyses: AssetAnalysis[] = [];
    
    for (const symbol of symbols) {
        try {
            // Fetch historical data
            const historicalData = await fetchHistoricalData(symbol.symbol, timeframe);
            
            // Get news articles
            let newsArticles = [];
            try {
                const searchTerms = await generateSearchTerms(symbol.symbol);
                newsArticles = await searchNews(searchTerms, timeframe);
            } catch (newsError) {
                console.warn(`Failed to fetch news for ${symbol.symbol}:`, newsError);
            }
            
            // Get trading analysis
            const analysisResult = await getTradingPosition(
                symbol.symbol,
                walletAmount,
                indicators,
                historicalData,
                newsArticles,
                undefined,
                false,
                false,
                false,
                timeframe
            );
            
            analyses.push({
                symbol: symbol.symbol,
                historicalData,
                analysisResult,
                isLoading: false
            });
            
        } catch (error) {
            console.error(`Analysis failed for ${symbol.symbol}:`, error);
            analyses.push({
                symbol: symbol.symbol,
                historicalData: [],
                analysisResult: null,
                isLoading: false,
                error: `Analysis failed: ${error.message}`
            });
        }
    }
    
    return analyses;
};

export const runProfitMaxOptimization = async (
    config: ProfitMaxConfig,
    onProgress?: (progress: number, status: string) => void
): Promise<OptimizationResult> => {
    const tierConfig = TIER_CONFIGS[config.tier];
    
    onProgress?.(0, 'Initializing ProfitMax optimization...');
    
    // Generate optimization candidates
    const symbolCandidates = await generateSymbolCandidates(config.marketType, config.market, tierConfig.maxSymbolsToTest);
    const indicatorCombinations = generateIndicatorCombinations(config.userSelectedIndicators, tierConfig.maxIndicatorCombinations);
    const walletAmounts = generateWalletAmounts(config.initialWalletAmount, tierConfig.maxWalletAmounts);
    const timeframes = TIMEFRAME_OPTIONS.slice(0, tierConfig.maxTimeframesToTest).map(t => t.value);
    
    const totalCombinations = tierConfig.maxTotalCombinations;
    
    onProgress?.(10, `Analyzing ${totalCombinations} optimization combinations...`);
    
    const optimizationCandidates: OptimizationCandidate[] = [];
    let processedCombinations = 0;
    
    // Test different combinations efficiently
    let combinationsProcessed = 0;
    
    for (const timeframe of timeframes) {
        if (combinationsProcessed >= totalCombinations) break;
        
        for (const indicators of indicatorCombinations) {
            if (combinationsProcessed >= totalCombinations) break;
            
            for (const walletAmount of walletAmounts) {
                if (combinationsProcessed >= totalCombinations) break;
                
                // Select top symbols for this combination (limit to maxSymbols)
                const selectedSymbols = symbolCandidates.slice(0, Math.min(config.maxSymbols, 3));
                
                try {
                    const analyses = await analyzeSymbolsWithConfig(selectedSymbols, walletAmount, indicators, timeframe);
                    const { profit, confidence } = calculateProfitPotential(analyses);
                    
                    optimizationCandidates.push({
                        symbols: selectedSymbols,
                        walletAmount,
                        indicators,
                        timeframe,
                        expectedProfit: profit,
                        confidence,
                        analyses
                    });
                    
                    combinationsProcessed++;
                    const progress = 10 + (combinationsProcessed / totalCombinations) * 80;
                    onProgress?.(progress, `Processed ${combinationsProcessed}/${totalCombinations} combinations...`);
                    
                } catch (error) {
                    console.error('Error in optimization candidate:', error);
                    combinationsProcessed++;
                }
            }
        }
    }
    
    onProgress?.(90, 'Finding optimal configuration...');
    
    // Find the best combination
    const bestCandidate = optimizationCandidates.reduce((best, current) => {
        const bestScore = best.expectedProfit * (best.confidence / 100);
        const currentScore = current.expectedProfit * (current.confidence / 100);
        return currentScore > bestScore ? current : best;
    }, optimizationCandidates[0]);
    
    if (!bestCandidate) {
        throw new Error('No valid optimization results found');
    }
    
    onProgress?.(100, 'Optimization complete!');
    
    return {
        bestSymbols: bestCandidate.symbols,
        bestWalletAmount: bestCandidate.walletAmount,
        bestIndicators: bestCandidate.indicators,
        bestTimeframe: bestCandidate.timeframe,
        expectedProfitPercentage: bestCandidate.expectedProfit,
        confidence: bestCandidate.confidence,
        optimizationDetails: {
            symbolsAnalyzed: Math.min(symbolCandidates.length, 10),
            timeframesAnalyzed: timeframes.length,
            indicatorCombinationsAnalyzed: indicatorCombinations.length,
            walletAmountsAnalyzed: walletAmounts.length,
            totalAnalyses: optimizationCandidates.length
        },
        analyses: bestCandidate.analyses
    };
};

export const getProfitMaxRecommendations = async (marketType: MarketType, market: string): Promise<{
    recommendedSymbols: FmpSearchResult[];
    recommendedIndicators: string[];
    recommendedTimeframes: string[];
}> => {
    // Get market-specific recommendations
    const marketData = MARKET_OPTIONS[marketType]?.find(m => m.value === market);
    const recommendedSymbols = marketData?.symbols?.slice(0, 10).map(s => ({ symbol: s.symbol, name: s.name })) || [];
    
    // Recommend high-performing indicators for different market types
    let recommendedIndicators: string[];
    switch (marketType) {
        case MarketType.STOCKS:
            recommendedIndicators = ['SMA', 'RSI', 'Volume', 'MACD'];
            break;
        case MarketType.CRYPTO:
            recommendedIndicators = ['EMA', 'RSI', 'Volume', 'Volatility'];
            break;
        case MarketType.FOREX:
            recommendedIndicators = ['SMA', 'EMA', 'RSI', 'ADX'];
            break;
        case MarketType.COMMODITIES:
            recommendedIndicators = ['SMA', 'RSI', 'Volume', 'OpenInterest'];
            break;
        default:
            recommendedIndicators = ['SMA', 'RSI', 'Volume'];
    }
    
    // Recommend timeframes based on market type
    let recommendedTimeframes: string[];
    switch (marketType) {
        case MarketType.CRYPTO:
            recommendedTimeframes = ['1h', '4h', '1d'];
            break;
        case MarketType.FOREX:
            recommendedTimeframes = ['15m', '1h', '4h'];
            break;
        default:
            recommendedTimeframes = ['1d', '1M', '3M'];
    }
    
    return {
        recommendedSymbols,
        recommendedIndicators,
        recommendedTimeframes
    };
};
