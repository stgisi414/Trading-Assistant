import type { HistoricalDataPoint, FmpSearchResult } from '../types.ts';

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

if (!FMP_API_KEY) {
    console.warn("FMP_API_KEY environment variable not set. Please get a free API key from financialmodelingprep.com for live data. Falling back to mock data.");
}

const generateMockData = (symbol: string, timeframe: string = '1d'): HistoricalDataPoint[] => {
    const mockData: HistoricalDataPoint[] = [];
    let lastClose = 150 + Math.random() * 50; // Random starting point
    let lastOpenInterest = Math.floor(Math.random() * 500000) + 100000; // Random starting open interest
    const now = new Date();
    
    // Determine data points based on timeframe
    let dataPoints = 30;
    let intervalMs = 24 * 60 * 60 * 1000; // 1 day default
    let volatilityFactor = 0.02; // 2% daily volatility
    
    if (timeframe.includes('m')) {
        const minutes = parseInt(timeframe);
        intervalMs = minutes * 60 * 1000;
        dataPoints = Math.min(96, 30 * (1440 / minutes)); // Max 96 points for intraday
        volatilityFactor = 0.002 * Math.sqrt(minutes / 30); // Scale volatility with timeframe
    } else if (timeframe.includes('h')) {
        const hours = parseInt(timeframe);
        intervalMs = hours * 60 * 60 * 1000;
        dataPoints = Math.min(168, 30 * (24 / hours)); // Max 168 points
        volatilityFactor = 0.005 * Math.sqrt(hours);
    }

    for (let i = dataPoints - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - (i * intervalMs));
        const change = (Math.random() - 0.48) * (lastClose * volatilityFactor);
        const newClose = Math.max(10, lastClose + change);
        
        // Generate realistic OHLC data
        const open = lastClose;
        const high = Math.max(open, newClose) * (1 + Math.random() * volatilityFactor);
        const low = Math.min(open, newClose) * (1 - Math.random() * volatilityFactor);
        const baseVolume = timeframe.includes('m') ? 100000 : 1000000;
        const volume = Math.floor(Math.random() * baseVolume * 10) + baseVolume;
        
        // Generate open interest data (typically more stable than price)
        const openInterestChange = (Math.random() - 0.5) * (lastOpenInterest * 0.02);
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
            open: parseFloat(open.toFixed(2)),
            high: parseFloat(high.toFixed(2)),
            low: parseFloat(low.toFixed(2)),
            close: parseFloat(newClose.toFixed(2)),
            volume: volume,
            openInterest: Math.floor(newOpenInterest)
        });
        
        lastClose = newClose;
        lastOpenInterest = newOpenInterest;
    }
    return mockData;
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
    if(!FMP_API_KEY) {
        console.warn(`No API key available, using mock data for ${symbol}`);
        return generateMockData(symbol, timeframe);
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
            console.warn(`API request failed for ${symbol} with timeframe ${timeframe}. Status: ${response.status}. Falling back to mock data.`);
            return generateMockData(symbol, timeframe);
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

        if (!historicalData || historicalData.length === 0) {
            console.warn(`No historical data available for ${symbol} with timeframe ${timeframe}. Falling back to mock data.`);
            return generateMockData(symbol, timeframe);
        }

        // Transform and sort data
        return historicalData.map((d: any) => ({
            date: d.date,
            open: d.open || d.close,
            high: d.high || d.close,
            low: d.low || d.close,
            close: d.close,
            volume: d.volume || 0,
            openInterest: d.openInterest || 0
        })).reverse();
    } catch (error) {
        console.warn(`Error fetching historical data for ${symbol} with timeframe ${timeframe}:`, error);
        console.warn(`Falling back to mock data for ${symbol}`);
        return generateMockData(symbol, timeframe);
    }
};