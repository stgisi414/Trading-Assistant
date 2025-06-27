import type { HistoricalDataPoint, FmpSearchResult } from '../types.ts';

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

if (!FMP_API_KEY) {
    console.warn("FMP_API_KEY environment variable not set. Please get a free API key from financialmodelingprep.com for live data. Falling back to mock data.");
}

const generateMockData = (symbol: string): HistoricalDataPoint[] => {
    const mockData: HistoricalDataPoint[] = [];
    let lastClose = 150 + Math.random() * 50; // Random starting point
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const change = (Math.random() - 0.48) * (lastClose * 0.05); // up to 5% change per day
        const newClose = Math.max(10, lastClose + change);
        
        // Generate realistic OHLC data
        const volatility = 0.02; // 2% daily volatility
        const open = lastClose;
        const high = Math.max(open, newClose) * (1 + Math.random() * volatility);
        const low = Math.min(open, newClose) * (1 - Math.random() * volatility);
        const volume = Math.floor(Math.random() * 10000000) + 1000000; // 1M to 11M volume

        mockData.push({
            date: date.toISOString().split('T')[0],
            open: open,
            high: high,
            low: low,
            close: newClose,
            volume: volume
        });
        
        lastClose = newClose;
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

export const fetchHistoricalData = async (symbol: string, timeframe: string, from?: string, to?: string): Promise<HistoricalDataPoint[]> => {
    if(!FMP_API_KEY) {
        return generateMockData(symbol);
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
            const errorData = await response.json();
            throw new Error(errorData['Error Message'] || `Failed to fetch historical data for ${symbol}`);
        }
        const data = await response.json();
        
        let historicalData;
        if (endpoint === 'historical-chart') {
            // Intraday data comes as array directly
            historicalData = data;
        } else {
            // Daily data comes in historical property
            if (!data.historical || data.historical.length === 0) {
                throw new Error(`No historical data found for ${symbol}. It may be an invalid symbol or have no data in the selected date range.`);
            }
            historicalData = data.historical;
        }

        if (!historicalData || historicalData.length === 0) {
            throw new Error(`No historical data found for ${symbol} with timeframe ${timeframe}.`);
        }

        // Transform and sort data
        return historicalData.map((d: any) => ({
            date: d.date,
            open: d.open || d.close,
            high: d.high || d.close,
            low: d.low || d.close,
            close: d.close,
            volume: d.volume || 0
        })).reverse();
    } catch (error) {
        console.error(`Error fetching historical data for ${symbol}:`, error);
        throw error;
    }
};