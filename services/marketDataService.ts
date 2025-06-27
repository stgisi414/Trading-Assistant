import type { HistoricalDataPoint, FmpSearchResult } from '../types.ts';

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

if (!FMP_API_KEY) {
    console.warn("FMP_API_KEY environment variable not set. Please get a free API key from financialmodelingprep.com for live data. Falling back to mock data.");
}

const generateMockData = (symbol: string, timeframe: string = '1d'): HistoricalDataPoint[] => {
    try {
        const mockData: HistoricalDataPoint[] = [];
        // Use symbol hash for consistent starting prices per symbol
        const symbolHash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        let lastClose = 100 + (symbolHash % 200) + Math.random() * 50; // Consistent starting point per symbol
        let lastOpenInterest = Math.floor(Math.random() * 500000) + 100000;
        const now = new Date();
        
        // Determine data points based on timeframe
        let dataPoints = 30;
        let intervalMs = 24 * 60 * 60 * 1000; // 1 day default
        let volatilityFactor = 0.02; // 2% daily volatility
        
        if (timeframe.includes('m')) {
            const minutes = parseInt(timeframe) || 5;
            intervalMs = minutes * 60 * 1000;
            dataPoints = Math.min(96, Math.max(20, 30 * (1440 / minutes))); // Ensure minimum 20 points
            volatilityFactor = 0.002 * Math.sqrt(minutes / 30);
        } else if (timeframe.includes('h')) {
            const hours = parseInt(timeframe) || 1;
            intervalMs = hours * 60 * 60 * 1000;
            dataPoints = Math.min(168, Math.max(24, 30 * (24 / hours))); // Ensure minimum 24 points
            volatilityFactor = 0.005 * Math.sqrt(hours);
        }

        console.log(`Generating ${dataPoints} mock data points for ${symbol} with timeframe ${timeframe}`);

        for (let i = dataPoints - 1; i >= 0; i--) {
            const date = new Date(now.getTime() - (i * intervalMs));
            const change = (Math.random() - 0.48) * (lastClose * volatilityFactor);
            const newClose = Math.max(10, lastClose + change);
            
            // Generate realistic OHLC data
            const open = lastClose;
            const highMultiplier = 1 + Math.random() * volatilityFactor;
            const lowMultiplier = 1 - Math.random() * volatilityFactor;
            const high = Math.max(open, newClose) * highMultiplier;
            const low = Math.min(open, newClose) * lowMultiplier;
            
            const baseVolume = timeframe.includes('m') ? 50000 : timeframe.includes('h') ? 200000 : 1000000;
            const volume = Math.floor(Math.random() * baseVolume * 5) + baseVolume;
            
            // Generate open interest data (more stable than price)
            const openInterestChange = (Math.random() - 0.5) * (lastOpenInterest * 0.01);
            const newOpenInterest = Math.max(50000, lastOpenInterest + openInterestChange);

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
        
        console.log(`Successfully generated ${mockData.length} mock data points for ${symbol}`);
        return mockData;
    } catch (error) {
        console.error(`Error generating mock data for ${symbol}:`, error);
        // Return minimal fallback data
        return [{
            date: new Date().toISOString().split('T')[0],
            open: 100,
            high: 105,
            low: 95,
            close: 102,
            volume: 1000000,
            openInterest: 100000
        }];
    }
}


export const searchSymbols = async (query: string): Promise<FmpSearchResult[]> => {
    if (!query || !FMP_API_KEY) return [];
    try {
        const response = await fetch(`${FMP_BASE_URL}/search-ticker?query=${query}&limit=10&exchange=NASDAQ,NYSE,AMEX,TSX,EURONEXT&apikey=${FMP_API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to search symbols: ${response.statusText}`);
        }
        const data: FmpSearchResult[] = await response.json();
        return data;
    } catch (error) {
        console.error("Error searching symbols:", error);
        return [];
    }
};

const getTimeframeEndpoint = (timeframe: string): string => {
    // For intraday timeframes (minutes/hours), use different endpoint
    if (timeframe.includes('m') || timeframe.includes('h')) {
        return 'historical-chart';
    }
    return 'historical-price-full';
};

const getTimeframeInterval = (timeframe: string): string => {
    // Map timeframe to FMP interval format
    const intervalMap: Record<string, string> = {
        '5m': '5min',
        '15m': '15min',
        '30m': '30min',
        '1h': '1hour',
        '4h': '4hour',
    };
    return intervalMap[timeframe] || '1day';
};

export const fetchOptionsData = async (symbol: string): Promise<any> => {
    if (!FMP_API_KEY) {
        // Return mock options data when no API key
        return {
            calls: [
                { strike: 150, expiration: '2024-02-16', bid: 2.45, ask: 2.55, lastPrice: 2.50 },
                { strike: 155, expiration: '2024-02-16', bid: 1.85, ask: 1.95, lastPrice: 1.90 },
                { strike: 160, expiration: '2024-02-16', bid: 1.25, ask: 1.35, lastPrice: 1.30 }
            ],
            puts: [
                { strike: 150, expiration: '2024-02-16', bid: 3.15, ask: 3.25, lastPrice: 3.20 },
                { strike: 155, expiration: '2024-02-16', bid: 4.25, ask: 4.35, lastPrice: 4.30 },
                { strike: 160, expiration: '2024-02-16', bid: 5.45, ask: 5.55, lastPrice: 5.50 }
            ]
        };
    }

    try {
        const response = await fetch(`${FMP_BASE_URL}/options/${symbol}?apikey=${FMP_API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch options data: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching options data for ${symbol}:`, error);
        // Return mock data on error
        return {
            calls: [],
            puts: []
        };
    }
};

export const fetchHistoricalData = async (symbol: string, timeframe: string, from?: string, to?: string): Promise<HistoricalDataPoint[]> => {
    // Always try to generate mock data first as fallback
    const mockData = generateMockData(symbol, timeframe);
    
    if(!FMP_API_KEY) {
        console.warn(`No API key available, using mock data for ${symbol}`);
        return mockData;
    }

    try {
        const endpoint = getTimeframeEndpoint(timeframe);
        let url = `${FMP_BASE_URL}/${endpoint}/${symbol}`;
        
        if (endpoint === 'historical-chart') {
            // For intraday data
            const interval = getTimeframeInterval(timeframe);
            url += `/${interval}`;
            if (from && to) {
                url += `?from=${from}&to=${to}`;
            }
        } else {
            // For daily and longer timeframes
            if (from && to) {
                url += `?from=${from}&to=${to}`;
            }
        }
        
        url += `${url.includes('?') ? '&' : '?'}apikey=${FMP_API_KEY}`;

        const response = await fetch(url);
        if (!response.ok) {
            console.warn(`API request failed for ${symbol} with timeframe ${timeframe}. Status: ${response.status}. Market may be closed or data unavailable. Using mock data.`);
            return mockData;
        }
        
        const data = await response.json();
        
        let historicalData;
        if (endpoint === 'historical-chart') {
            // Intraday data comes as array directly
            historicalData = data;
        } else {
            // Daily data comes in historical property
            historicalData = data.historical;
        }

        if (!historicalData || !Array.isArray(historicalData) || historicalData.length === 0) {
            console.warn(`No historical data available for ${symbol} with timeframe ${timeframe}. Market may be closed or data unavailable. Using mock data.`);
            return mockData;
        }

        // Transform and sort data - ensure all required fields exist
        const transformedData = historicalData.map((d: any) => ({
            date: d.date || new Date().toISOString().split('T')[0],
            open: Number(d.open || d.close || 0),
            high: Number(d.high || d.close || 0),
            low: Number(d.low || d.close || 0),
            close: Number(d.close || 0),
            volume: Number(d.volume || 0),
            openInterest: Number(d.openInterest || Math.floor(Math.random() * 500000) + 100000)
        })).filter(d => d.close > 0); // Filter out invalid data points

        if (transformedData.length === 0) {
            console.warn(`All data points were invalid for ${symbol} with timeframe ${timeframe}. Using mock data.`);
            return mockData;
        }

        return transformedData.reverse();
    } catch (error) {
        console.warn(`Error fetching historical data for ${symbol} with timeframe ${timeframe}:`, error?.message || error);
        console.warn(`Using mock data for ${symbol} - this is normal when markets are closed or for testing`);
        return mockData;
    }
};