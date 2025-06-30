
export interface TechnicalIndicatorValues {
    sma?: { period: number; value: number; trend: string }[];
    ema?: { period: number; value: number; trend: string }[];
    rsi?: { value: number; signal: string };
    macd?: { macd: number; signal: number; histogram: number; trend: string };
    bollingerBands?: { upper: number; middle: number; lower: number; position: string };
    stochasticOscillator?: { k: number; d: number; signal: string };
    adx?: { value: number; trend: string };
    volume?: { current: number; average: number; trend: string };
    volatility?: { value: number; level: string };
}

export const calculateSMA = (data: number[], period: number): number => {
    if (data.length < period) return 0;
    const slice = data.slice(-period);
    return slice.reduce((sum, price) => sum + price, 0) / period;
};

export const calculateEMA = (data: number[], period: number): number => {
    if (data.length < period) return 0;
    
    const multiplier = 2 / (period + 1);
    let ema = calculateSMA(data.slice(0, period), period);
    
    for (let i = period; i < data.length; i++) {
        ema = (data[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
};

export const calculateRSI = (data: number[], period: number = 14): number => {
    if (data.length < period + 1) return 50;
    
    const changes = [];
    for (let i = 1; i < data.length; i++) {
        changes.push(data[i] - data[i - 1]);
    }
    
    const gains = changes.map(change => change > 0 ? change : 0);
    const losses = changes.map(change => change < 0 ? Math.abs(change) : 0);
    
    const avgGain = calculateSMA(gains.slice(-period), period);
    const avgLoss = calculateSMA(losses.slice(-period), period);
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
};

export const calculateMACD = (data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) => {
    if (data.length < slowPeriod) return { macd: 0, signal: 0, histogram: 0 };
    
    const fastEMA = calculateEMA(data, fastPeriod);
    const slowEMA = calculateEMA(data, slowPeriod);
    const macd = fastEMA - slowEMA;
    
    // Calculate signal line (EMA of MACD)
    const macdHistory = [];
    for (let i = slowPeriod; i <= data.length; i++) {
        const sliceData = data.slice(0, i);
        const fastEMASlice = calculateEMA(sliceData, fastPeriod);
        const slowEMASlice = calculateEMA(sliceData, slowPeriod);
        macdHistory.push(fastEMASlice - slowEMASlice);
    }
    
    const signal = calculateEMA(macdHistory, signalPeriod);
    const histogram = macd - signal;
    
    return { macd, signal, histogram };
};

export const calculateBollingerBands = (data: number[], period: number = 20, stdDev: number = 2) => {
    if (data.length < period) return { upper: 0, middle: 0, lower: 0 };
    
    const slice = data.slice(-period);
    const middle = calculateSMA(slice, period);
    
    const variance = slice.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    const upper = middle + (standardDeviation * stdDev);
    const lower = middle - (standardDeviation * stdDev);
    
    return { upper, middle, lower };
};

export const calculateStochasticOscillator = (highs: number[], lows: number[], closes: number[], kPeriod: number = 14, dPeriod: number = 3) => {
    if (closes.length < kPeriod) return { k: 50, d: 50 };
    
    const recentHighs = highs.slice(-kPeriod);
    const recentLows = lows.slice(-kPeriod);
    const currentClose = closes[closes.length - 1];
    
    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);
    
    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    
    // Calculate %D (SMA of %K)
    const kValues = [];
    for (let i = Math.max(0, closes.length - dPeriod); i < closes.length; i++) {
        const sliceHighs = highs.slice(Math.max(0, i - kPeriod + 1), i + 1);
        const sliceLows = lows.slice(Math.max(0, i - kPeriod + 1), i + 1);
        const sliceClose = closes[i];
        
        const sliceHighestHigh = Math.max(...sliceHighs);
        const sliceLowestLow = Math.min(...sliceLows);
        
        const sliceK = ((sliceClose - sliceLowestLow) / (sliceHighestHigh - sliceLowestLow)) * 100;
        kValues.push(sliceK);
    }
    
    const d = calculateSMA(kValues, Math.min(dPeriod, kValues.length));
    
    return { k, d };
};

export const calculateADX = (highs: number[], lows: number[], closes: number[], period: number = 14): number => {
    if (closes.length < period + 1) return 25;
    
    // Simplified ADX calculation
    const trueRanges = [];
    const plusDMs = [];
    const minusDMs = [];
    
    for (let i = 1; i < closes.length; i++) {
        const highDiff = highs[i] - highs[i - 1];
        const lowDiff = lows[i - 1] - lows[i];
        
        const plusDM = highDiff > lowDiff && highDiff > 0 ? highDiff : 0;
        const minusDM = lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0;
        
        const trueRange = Math.max(
            highs[i] - lows[i],
            Math.abs(highs[i] - closes[i - 1]),
            Math.abs(lows[i] - closes[i - 1])
        );
        
        plusDMs.push(plusDM);
        minusDMs.push(minusDM);
        trueRanges.push(trueRange);
    }
    
    const avgTR = calculateSMA(trueRanges.slice(-period), period);
    const avgPlusDM = calculateSMA(plusDMs.slice(-period), period);
    const avgMinusDM = calculateSMA(minusDMs.slice(-period), period);
    
    const plusDI = (avgPlusDM / avgTR) * 100;
    const minusDI = (avgMinusDM / avgTR) * 100;
    
    const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
    
    return dx;
};

export const calculateTechnicalIndicators = (
    historicalData: any[],
    selectedIndicators: string[]
): TechnicalIndicatorValues => {
    if (!historicalData || historicalData.length === 0) {
        return {};
    }

    const closes = historicalData.map(d => d.close);
    const highs = historicalData.map(d => d.high || d.close);
    const lows = historicalData.map(d => d.low || d.close);
    const volumes = historicalData.map(d => d.volume || 0);
    
    const results: TechnicalIndicatorValues = {};

    if (selectedIndicators.includes('SMA')) {
        const sma9 = calculateSMA(closes, 9);
        const sma20 = calculateSMA(closes, 20);
        const sma50 = calculateSMA(closes, 50);
        const sma200 = calculateSMA(closes, 200);
        const currentPrice = closes[closes.length - 1];
        
        results.sma = [
            { 
                period: 9, 
                value: sma9,
                trend: currentPrice > sma9 ? 'bullish' : 'bearish'
            },
            { 
                period: 20, 
                value: sma20,
                trend: currentPrice > sma20 ? 'bullish' : 'bearish'
            },
            { 
                period: 50, 
                value: sma50,
                trend: currentPrice > sma50 ? 'bullish' : 'bearish'
            },
            { 
                period: 200, 
                value: sma200,
                trend: currentPrice > sma200 ? 'bullish' : 'bearish'
            }
        ];
    }

    if (selectedIndicators.includes('EMA')) {
        const ema12 = calculateEMA(closes, 12);
        const ema26 = calculateEMA(closes, 26);
        const currentPrice = closes[closes.length - 1];
        
        results.ema = [
            { 
                period: 12, 
                value: ema12,
                trend: currentPrice > ema12 ? 'bullish' : 'bearish'
            },
            { 
                period: 26, 
                value: ema26,
                trend: currentPrice > ema26 ? 'bullish' : 'bearish'
            }
        ];
    }

    if (selectedIndicators.includes('RSI')) {
        const rsi = calculateRSI(closes);
        let signal = 'neutral';
        if (rsi > 70) signal = 'overbought';
        else if (rsi < 30) signal = 'oversold';
        
        results.rsi = { value: rsi, signal };
    }

    if (selectedIndicators.includes('MACD')) {
        const macdData = calculateMACD(closes);
        let trend = 'neutral';
        if (macdData.macd > macdData.signal) trend = 'bullish';
        else if (macdData.macd < macdData.signal) trend = 'bearish';
        
        results.macd = { ...macdData, trend };
    }

    if (selectedIndicators.includes('BollingerBands')) {
        const bb = calculateBollingerBands(closes);
        const currentPrice = closes[closes.length - 1];
        let position = 'middle';
        if (currentPrice > bb.upper) position = 'above_upper';
        else if (currentPrice < bb.lower) position = 'below_lower';
        
        results.bollingerBands = { ...bb, position };
    }

    if (selectedIndicators.includes('StochasticOscillator')) {
        const stoch = calculateStochasticOscillator(highs, lows, closes);
        let signal = 'neutral';
        if (stoch.k > 80 && stoch.d > 80) signal = 'overbought';
        else if (stoch.k < 20 && stoch.d < 20) signal = 'oversold';
        
        results.stochasticOscillator = { ...stoch, signal };
    }

    if (selectedIndicators.includes('ADX')) {
        const adx = calculateADX(highs, lows, closes);
        let trend = 'weak';
        if (adx > 50) trend = 'very_strong';
        else if (adx > 25) trend = 'strong';
        
        results.adx = { value: adx, trend };
    }

    if (selectedIndicators.includes('Volume')) {
        const avgVolume = calculateSMA(volumes, 20);
        const currentVolume = volumes[volumes.length - 1];
        const trend = currentVolume > avgVolume ? 'above_average' : 'below_average';
        
        results.volume = { current: currentVolume, average: avgVolume, trend };
    }

    if (selectedIndicators.includes('Volatility')) {
        const returns = [];
        for (let i = 1; i < closes.length; i++) {
            returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
        }
        
        const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
        const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility in %
        
        let level = 'normal';
        if (volatility > 30) level = 'high';
        else if (volatility < 15) level = 'low';
        
        results.volatility = { value: volatility, level };
    }

    return results;
};
