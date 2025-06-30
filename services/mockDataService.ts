
import type { HistoricalDataPoint } from '../types.ts';

export const generateMockData = (symbol: string, timeframe: string = '1d'): HistoricalDataPoint[] => {
    try {
        const mockData: HistoricalDataPoint[] = [];
        // Use symbol hash for consistent starting prices per symbol
        const symbolHash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        // Get realistic starting prices based on common symbols
        let basePrice = 100;
        const symbolUpper = symbol.toUpperCase();
        if (symbolUpper === 'AAPL') basePrice = 180;
        else if (symbolUpper === 'TSLA') basePrice = 250;
        else if (symbolUpper === 'GOOGL') basePrice = 140;
        else if (symbolUpper === 'MSFT') basePrice = 410;
        else if (symbolUpper === 'AMZN') basePrice = 180;
        else if (symbolUpper === 'SPY') basePrice = 500;
        else if (symbolUpper === 'QQQ') basePrice = 460;
        else if (symbolUpper === 'IWM') basePrice = 220;
        else if (symbolUpper === 'NVDA') basePrice = 130;
        else if (symbolUpper === 'ORCL') basePrice = 120;
        else basePrice = 80 + (symbolHash % 120);

        let lastClose = basePrice + (Math.random() - 0.5) * 20;
        let lastOpenInterest = Math.floor(Math.random() * 800000) + 200000;
        const now = new Date();

        // Determine data points based on timeframe with more realistic amounts
        let dataPoints = 50;
        let intervalMs = 24 * 60 * 60 * 1000; // 1 day default
        let volatilityFactor = 0.025; // 2.5% daily volatility

        if (timeframe.includes('m')) {
            const minutes = parseInt(timeframe) || 5;
            intervalMs = minutes * 60 * 1000;
            dataPoints = Math.min(200, Math.max(50, 120 * (minutes <= 15 ? 4 : 2))); // More data for shorter timeframes
            volatilityFactor = 0.003 * Math.sqrt(minutes / 5);
        } else if (timeframe.includes('h')) {
            const hours = parseInt(timeframe) || 1;
            intervalMs = hours * 60 * 60 * 1000;
            dataPoints = Math.min(168, Math.max(48, 72 * (hours <= 4 ? 2 : 1))); // More data for shorter timeframes
            volatilityFactor = 0.008 * Math.sqrt(hours);
        } else if (timeframe.includes('d') || timeframe.includes('D')) {
            dataPoints = 100;
            volatilityFactor = 0.025;
        }

        console.log(`Generating ${dataPoints} realistic mock data points for ${symbol} with timeframe ${timeframe}`);

        for (let i = dataPoints - 1; i >= 0; i--) {
            const date = new Date(now.getTime() - (i * intervalMs));

            // More realistic price movement with trend consideration
            const trendFactor = Math.sin(i / dataPoints * Math.PI) * 0.1; // Slight upward trend
            const randomChange = (Math.random() - 0.47) * volatilityFactor; // Slight bullish bias
            const change = (randomChange + trendFactor) * lastClose;
            const newClose = Math.max(lastClose * 0.5, lastClose + change); // Prevent unrealistic drops

            // Generate realistic OHLC data
            const open = lastClose;
            const volatility = Math.random() * volatilityFactor;
            const high = Math.max(open, newClose) * (1 + volatility);
            const low = Math.min(open, newClose) * (1 - volatility);

            // More realistic volume based on timeframe and symbol
            let baseVolume = 1000000;
            if (timeframe.includes('m')) baseVolume = 25000 * parseInt(timeframe);
            else if (timeframe.includes('h')) baseVolume = 150000 * parseInt(timeframe);

            // Adjust volume for popular symbols
            if (['AAPL', 'TSLA', 'SPY', 'QQQ', 'MSFT', 'NVDA', 'ORCL'].includes(symbolUpper)) {
                baseVolume *= 3;
            }

            const volume = Math.floor(Math.random() * baseVolume * 2) + baseVolume;

            // Generate more stable open interest
            const openInterestChange = (Math.random() - 0.5) * (lastOpenInterest * 0.005);
            const newOpenInterest = Math.max(100000, lastOpenInterest + openInterestChange);

            // Format date based on timeframe
            let dateString;
            if (timeframe.includes('m') || timeframe.includes('h')) {
                dateString = date.toISOString();
            } else {
                dateString = date.toISOString().split('T')[0];
            }

            mockData.push({
                date: dateString,
                open: Number(open.toFixed(2)),
                high: Number(high.toFixed(2)),
                low: Number(low.toFixed(2)),
                close: Number(newClose.toFixed(2)),
                volume: volume,
                openInterest: Math.floor(newOpenInterest)
            });

            lastClose = newClose;
            lastOpenInterest = newOpenInterest;
        }

        console.log(`✅ Successfully generated ${mockData.length} realistic mock data points for ${symbol}`);
        return mockData;
    } catch (error) {
        console.error(`Error generating mock data for ${symbol}:`, error);
        // Return robust fallback data
        const fallbackData = [];
        const basePrice = 150;
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const price = basePrice + (Math.random() - 0.5) * 10;
            fallbackData.unshift({
                date: date.toISOString().split('T')[0],
                open: Number((price * 0.99).toFixed(2)),
                high: Number((price * 1.02).toFixed(2)),
                low: Number((price * 0.98).toFixed(2)),
                close: Number(price.toFixed(2)),
                volume: Math.floor(Math.random() * 1000000) + 500000,
                openInterest: Math.floor(Math.random() * 300000) + 150000
            });
        }
        return fallbackData;
    }
};
