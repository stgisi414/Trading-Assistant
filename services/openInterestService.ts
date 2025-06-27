
import type { HistoricalDataPoint, OpenInterestAnalysis } from '../types.ts';

export const analyzeOpenInterest = (historicalData: HistoricalDataPoint[]): OpenInterestAnalysis | null => {
    if (!historicalData || historicalData.length < 5) {
        return null;
    }

    // Filter data points that have open interest data
    const dataWithOI = historicalData.filter(d => d.openInterest && d.openInterest > 0);
    
    if (dataWithOI.length < 3) {
        return null;
    }

    const currentOI = dataWithOI[dataWithOI.length - 1].openInterest;
    const previousOI = dataWithOI[dataWithOI.length - 2].openInterest;
    const weekAgoOI = dataWithOI.length >= 7 ? dataWithOI[dataWithOI.length - 7].openInterest : dataWithOI[0].openInterest;

    // Additional safety checks
    if (!currentOI || !previousOI || !weekAgoOI || currentOI <= 0 || previousOI <= 0 || weekAgoOI <= 0) {
        return null;
    }

    // Calculate trend
    const shortTermChange = ((currentOI - previousOI) / previousOI) * 100;
    const longTermChange = ((currentOI - weekAgoOI) / weekAgoOI) * 100;

    let trend: 'INCREASING' | 'DECREASING' | 'STABLE';
    if (Math.abs(longTermChange) < 2) {
        trend = 'STABLE';
    } else if (longTermChange > 0) {
        trend = 'INCREASING';
    } else {
        trend = 'DECREASING';
    }

    // Calculate speculative ratio (volume to open interest ratio)
    const recentData = dataWithOI.slice(-5);
    const avgVolume = recentData.reduce((sum, d) => sum + (d.volume || 0), 0) / recentData.length;
    const speculativeRatio = avgVolume && currentOI ? avgVolume / currentOI : 0;

    // Determine market sentiment based on price movement and open interest changes
    const priceChange = ((dataWithOI[dataWithOI.length - 1].close - dataWithOI[0].close) / dataWithOI[0].close) * 100;
    
    let marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    if (priceChange > 2 && longTermChange > 0) {
        marketSentiment = 'BULLISH';
    } else if (priceChange < -2 && longTermChange > 0) {
        marketSentiment = 'BEARISH';
    } else {
        marketSentiment = 'NEUTRAL';
    }

    // Generate analysis text
    let analysis = `Current open interest: ${currentOI.toLocaleString()} contracts. `;
    
    if (trend === 'INCREASING') {
        analysis += `Open interest has increased by ${longTermChange.toFixed(1)}% over the past week, indicating growing market participation. `;
    } else if (trend === 'DECREASING') {
        analysis += `Open interest has decreased by ${Math.abs(longTermChange).toFixed(1)}% over the past week, suggesting position unwinding or reduced interest. `;
    } else {
        analysis += `Open interest has remained relatively stable, suggesting balanced market conditions. `;
    }

    if (speculativeRatio > 3) {
        analysis += `High volume-to-open-interest ratio (${speculativeRatio.toFixed(2)}) indicates significant speculative activity. `;
    } else if (speculativeRatio < 1) {
        analysis += `Low volume-to-open-interest ratio (${speculativeRatio.toFixed(2)}) suggests more institutional or hedging activity. `;
    }

    switch (marketSentiment) {
        case 'BULLISH':
            analysis += `The combination of rising prices and increasing open interest suggests a bullish sentiment with new money entering long positions.`;
            break;
        case 'BEARISH':
            analysis += `Rising open interest with declining prices suggests bearish sentiment with new short positions being established.`;
            break;
        case 'NEUTRAL':
            analysis += `Mixed signals from price and open interest changes suggest a neutral market outlook.`;
            break;
    }

    return {
        currentOpenInterest: currentOI,
        openInterestTrend: trend,
        speculativeRatio: speculativeRatio,
        marketSentiment: marketSentiment,
        analysis: analysis
    };
};
