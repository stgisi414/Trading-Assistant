
import type { HistoricalDataPoint } from '../types.ts';
import { calculateTechnicalIndicators } from './technicalIndicators.ts';

interface PredictiveParams {
    selectedIndicators: string[];
    walletAmount: string;
    selectedMarketType: string;
    includeOptionsAnalysis?: boolean;
    includeCallOptions?: boolean;
    includePutOptions?: boolean;
    includeOrderAnalysis?: boolean;
    selectedNonTechnicalIndicators?: string[];
}

interface MarketSentiment {
    bullish: number;
    bearish: number;
    neutral: number;
    volatility: number;
    momentum: number;
}

interface TrendAnalysis {
    shortTerm: 'bullish' | 'bearish' | 'neutral';
    mediumTerm: 'bullish' | 'bearish' | 'neutral';
    longTerm: 'bullish' | 'bearish' | 'neutral';
    strength: number; // 0-100
    confidence: number; // 0-100
}

export const analyzeTrend = (historicalData: HistoricalDataPoint[]): TrendAnalysis => {
    if (historicalData.length < 20) {
        return {
            shortTerm: 'neutral',
            mediumTerm: 'neutral',
            longTerm: 'neutral',
            strength: 50,
            confidence: 30
        };
    }

    const closes = historicalData.map(d => d.close);
    const recent = closes.slice(-5);
    const medium = closes.slice(-20);
    const long = closes.slice(-50);

    // Calculate trend slopes
    const shortTermSlope = (recent[recent.length - 1] - recent[0]) / recent.length;
    const mediumTermSlope = (medium[medium.length - 1] - medium[0]) / medium.length;
    const longTermSlope = long.length >= 50 ? (long[long.length - 1] - long[0]) / long.length : mediumTermSlope;

    // Determine trend directions
    const getTrend = (slope: number, threshold: number = 0.1) => {
        if (slope > threshold) return 'bullish';
        if (slope < -threshold) return 'bearish';
        return 'neutral';
    };

    const avgPrice = closes.reduce((sum, price) => sum + price, 0) / closes.length;
    const threshold = avgPrice * 0.001; // 0.1% of average price

    const shortTerm = getTrend(shortTermSlope, threshold);
    const mediumTerm = getTrend(mediumTermSlope, threshold * 0.5);
    const longTerm = getTrend(longTermSlope, threshold * 0.3);

    // Calculate strength based on consistency
    const trendAlignment = [shortTerm, mediumTerm, longTerm];
    const bullishCount = trendAlignment.filter(t => t === 'bullish').length;
    const bearishCount = trendAlignment.filter(t => t === 'bearish').length;
    const neutralCount = trendAlignment.filter(t => t === 'neutral').length;

    const strength = Math.max(bullishCount, bearishCount, neutralCount) * 33.33;
    const confidence = Math.min(90, strength + (closes.length / 2));

    return {
        shortTerm,
        mediumTerm,
        longTerm,
        strength,
        confidence
    };
};

export const calculateMarketSentiment = (
    historicalData: HistoricalDataPoint[],
    selectedIndicators: string[],
    selectedNonTechnicalIndicators: string[] = []
): MarketSentiment => {
    const technicalIndicators = calculateTechnicalIndicators(historicalData, selectedIndicators);
    
    let bullishSignals = 0;
    let bearishSignals = 0;
    let totalSignals = 0;

    // RSI sentiment
    if (technicalIndicators.rsi) {
        totalSignals++;
        if (technicalIndicators.rsi.value < 30) bullishSignals++; // Oversold = bullish
        else if (technicalIndicators.rsi.value > 70) bearishSignals++; // Overbought = bearish
    }

    // MACD sentiment
    if (technicalIndicators.macd) {
        totalSignals++;
        if (technicalIndicators.macd.trend === 'bullish') bullishSignals++;
        else if (technicalIndicators.macd.trend === 'bearish') bearishSignals++;
    }

    // SMA sentiment
    if (technicalIndicators.sma) {
        technicalIndicators.sma.forEach(sma => {
            totalSignals++;
            if (sma.trend === 'bullish') bullishSignals++;
            else if (sma.trend === 'bearish') bearishSignals++;
        });
    }

    // EMA sentiment
    if (technicalIndicators.ema) {
        technicalIndicators.ema.forEach(ema => {
            totalSignals++;
            if (ema.trend === 'bullish') bullishSignals++;
            else if (ema.trend === 'bearish') bearishSignals++;
        });
    }

    // Bollinger Bands sentiment
    if (technicalIndicators.bollingerBands) {
        totalSignals++;
        if (technicalIndicators.bollingerBands.position === 'below_lower') bullishSignals++;
        else if (technicalIndicators.bollingerBands.position === 'above_upper') bearishSignals++;
    }

    // Stochastic sentiment
    if (technicalIndicators.stochasticOscillator) {
        totalSignals++;
        if (technicalIndicators.stochasticOscillator.signal === 'oversold') bullishSignals++;
        else if (technicalIndicators.stochasticOscillator.signal === 'overbought') bearishSignals++;
    }

    // Volume sentiment
    if (technicalIndicators.volume) {
        totalSignals++;
        if (technicalIndicators.volume.trend === 'above_average') {
            // High volume can amplify current trend
            const trendAnalysis = analyzeTrend(historicalData);
            if (trendAnalysis.shortTerm === 'bullish') bullishSignals++;
            else if (trendAnalysis.shortTerm === 'bearish') bearishSignals++;
        }
    }

    // Non-technical indicators sentiment
    selectedNonTechnicalIndicators.forEach(indicator => {
        totalSignals++;
        // Add sentiment based on non-technical indicators
        if (indicator.includes('PE_Ratio') || indicator.includes('Value')) {
            bullishSignals += 0.5; // Value indicators tend to be bullish
        }
        if (indicator.includes('Social_Sentiment')) {
            // Assume neutral to slightly positive social sentiment
            bullishSignals += 0.3;
            bearishSignals += 0.2;
        }
        if (indicator.includes('Analyst_Rating')) {
            bullishSignals += 0.4; // Analysts tend to be optimistic
        }
    });

    const bullish = totalSignals > 0 ? (bullishSignals / totalSignals) * 100 : 33.33;
    const bearish = totalSignals > 0 ? (bearishSignals / totalSignals) * 100 : 33.33;
    const neutral = 100 - bullish - bearish;

    // Calculate volatility based on recent price movements
    const closes = historicalData.map(d => d.close);
    const recentReturns = closes.slice(-10).map((price, i, arr) => 
        i > 0 ? Math.abs((price - arr[i-1]) / arr[i-1]) : 0
    ).slice(1);
    const avgReturn = recentReturns.reduce((sum, ret) => sum + ret, 0) / recentReturns.length;
    const volatility = Math.min(100, avgReturn * 100 * 20); // Scale to 0-100

    // Calculate momentum
    const momentum = Math.abs(bullish - bearish);

    return {
        bullish: Math.max(0, Math.min(100, bullish)),
        bearish: Math.max(0, Math.min(100, bearish)),
        neutral: Math.max(0, Math.min(100, neutral)),
        volatility,
        momentum
    };
};

export const generatePredictiveDataPoints = (
    historicalData: HistoricalDataPoint[],
    futureStartDate: Date,
    futureEndDate: Date,
    params: PredictiveParams
): HistoricalDataPoint[] => {
    if (historicalData.length === 0) return [];

    const lastDataPoint = historicalData[historicalData.length - 1];
    const trendAnalysis = analyzeTrend(historicalData);
    const sentiment = calculateMarketSentiment(
        historicalData, 
        params.selectedIndicators, 
        params.selectedNonTechnicalIndicators
    );

    // Calculate time difference and number of points needed
    const timeDiff = futureEndDate.getTime() - futureStartDate.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const dataPoints = Math.min(daysDiff, 365); // Cap at 1 year

    const predictiveData: HistoricalDataPoint[] = [];
    
    // Base parameters for prediction
    let currentPrice = lastDataPoint.close;
    let currentVolume = lastDataPoint.volume || 1000000;
    
    // Calculate base volatility from historical data
    const closes = historicalData.map(d => d.close);
    const returns = closes.slice(-20).map((price, i, arr) => 
        i > 0 ? (price - arr[i-1]) / arr[i-1] : 0
    ).slice(1);
    const baseVolatility = Math.sqrt(returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length);

    // Determine overall trend direction and strength
    const trendBias = sentiment.bullish > sentiment.bearish ? 1 : 
                     sentiment.bearish > sentiment.bullish ? -1 : 0;
    const trendStrength = (Math.abs(sentiment.bullish - sentiment.bearish) / 100) * 0.5;

    // Generate future data points
    for (let i = 0; i < dataPoints; i++) {
        const date = new Date(futureStartDate.getTime() + (i * 24 * 60 * 60 * 1000));
        
        // Apply trend with some randomness
        const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
        const volatilityFactor = baseVolatility * (1 + sentiment.volatility / 100);
        const momentumFactor = sentiment.momentum / 100;
        
        // Calculate price change
        const trendChange = trendBias * trendStrength * 0.01; // 1% max trend per day
        const randomChange = randomFactor * volatilityFactor;
        const momentumChange = momentumFactor * (Math.random() - 0.5) * 0.005; // Small momentum effect
        
        const totalChange = trendChange + randomChange + momentumChange;
        const newPrice = currentPrice * (1 + totalChange);
        
        // Ensure price doesn't go negative or change too dramatically
        currentPrice = Math.max(newPrice, currentPrice * 0.8);
        currentPrice = Math.min(currentPrice, lastDataPoint.close * 3); // Cap at 3x original
        
        // Generate OHLC data
        const dailyVolatility = volatilityFactor * 0.5;
        const open = i === 0 ? lastDataPoint.close : predictiveData[i-1].close;
        const high = Math.max(open, currentPrice) * (1 + Math.random() * dailyVolatility);
        const low = Math.min(open, currentPrice) * (1 - Math.random() * dailyVolatility);
        
        // Volume with some correlation to price movements
        const volumeMultiplier = 1 + (Math.abs(totalChange) * 5); // Higher volume on big moves
        currentVolume = Math.floor(currentVolume * (0.8 + Math.random() * 0.4) * volumeMultiplier);
        
        predictiveData.push({
            date: date.toISOString().split('T')[0],
            open: Math.round(open * 100) / 100,
            high: Math.round(high * 100) / 100,
            low: Math.round(low * 100) / 100,
            close: Math.round(currentPrice * 100) / 100,
            volume: currentVolume,
            openInterest: Math.floor(Math.random() * 500000) + 100000
        });
    }

    return predictiveData;
};

export const extendHistoricalDataWithPrediction = (
    historicalData: HistoricalDataPoint[],
    customStartDate: string,
    customEndDate: string,
    params: PredictiveParams
): { 
    historicalData: HistoricalDataPoint[], 
    predictiveData: HistoricalDataPoint[],
    isPredictive: boolean 
} => {
    const endDate = new Date(customEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    // If end date is not in the future, return original data
    if (endDate <= today) {
        return {
            historicalData,
            predictiveData: [],
            isPredictive: false
        };
    }
    
    // Determine where prediction should start
    const lastHistoricalDate = historicalData.length > 0 
        ? new Date(historicalData[historicalData.length - 1].date)
        : today;
    
    const predictionStartDate = new Date(Math.max(lastHistoricalDate.getTime() + 24 * 60 * 60 * 1000, today.getTime()));
    
    // Generate predictive data points
    const predictiveData = generatePredictiveDataPoints(
        historicalData,
        predictionStartDate,
        endDate,
        params
    );
    
    console.log(`Generated ${predictiveData.length} predictive data points from ${predictionStartDate.toISOString().split('T')[0]} to ${customEndDate}`);
    
    return {
        historicalData,
        predictiveData,
        isPredictive: predictiveData.length > 0
    };
};
