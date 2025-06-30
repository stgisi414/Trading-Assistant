import type { HistoricalDataPoint, FmpSearchResult } from '../types.ts';

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY || process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

if (!FMP_API_KEY) {
    console.warn("FMP_API_KEY environment variable not set. Please add your API key to Replit Secrets. Falling back to mock data.");
} else {
    console.log("✅ FMP API key found, using real market data");
}

const generateMockData = (symbol: string, timeframe: string = '1d'): HistoricalDataPoint[] => {
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
            // Ensure we have enough data points for 30m timeframe
            if (minutes === 30) {
                dataPoints = Math.min(200, 96); // 2 days worth of 30m candles
            } else {
                dataPoints = Math.min(200, Math.max(50, 120 * (minutes <= 15 ? 4 : 2)));
            }
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
            if (['AAPL', 'TSLA', 'SPY', 'QQQ', 'MSFT', 'NVDA'].includes(symbolUpper)) {
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
        '1m': '1min',
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

export const fetchCompanyProfile = async (symbol: string): Promise<any> => {
    if (!FMP_API_KEY) {
        // Return mock company profile when no API key
        return {
            symbol: symbol,
            companyName: `${symbol} Corporation`,
            ceo: "John Smith",
            website: `https://www.${symbol.toLowerCase()}.com`,
            address: "123 Business Ave",
            city: "New York",
            state: "NY",
            zip: "10001",
            country: "US",
            phone: "(555) 123-4567",
            exchange: "NASDAQ",
            currency: "USD",
            industry: "Technology",
            sector: "Technology",
            employees: 50000,
            marketCap: 1000000000,
            description: `${symbol} is a leading technology company focused on innovation and growth.`,
            image: `https://financialmodelingprep.com/image-stock/${symbol}.png`,
            ipoDate: "2010-01-01"
        };
    }

    try {
        const response = await fetch(`${FMP_BASE_URL}/profile/${symbol}?apikey=${FMP_API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch company profile: ${response.statusText}`);
        }
        const data = await response.json();

        if (!data || data.length === 0) {
            throw new Error(`No company profile data available for ${symbol}`);
        }

        const profile = data[0]; // FMP returns an array with one object
        return {
            symbol: profile.symbol || symbol,
            companyName: profile.companyName || symbol,
            ceo: profile.ceo || "Not Available",
            website: profile.website || "",
            address: profile.address || "",
            city: profile.city || "",
            state: profile.state || "",
            zip: profile.zip || "",
            country: profile.country || "",
            phone: profile.phone || "",
            exchange: profile.exchangeShortName || profile.exchange || "",
            currency: profile.currency || "USD",
            industry: profile.industry || "",
            sector: profile.sector || "",
            employees: profile.fullTimeEmployees || 0,
            marketCap: profile.mktCap || 0,
            description: profile.description || "",
            image: profile.image || `https://financialmodelingprep.com/image-stock/${symbol}.png`,
            ipoDate: profile.ipoDate || ""
        };
    } catch (error) {
        console.error(`Error fetching company profile for ${symbol}:`, error);
        // Return mock data on error
        return {
            symbol: symbol,
            companyName: `${symbol} Corporation`,
            ceo: "Information Not Available",
            website: "",
            address: "",
            city: "",
            state: "",
            zip: "",
            country: "",
            phone: "",
            exchange: "",
            currency: "USD",
            industry: "",
            sector: "",
            employees: 0,
            marketCap: 0,
            description: "Company profile information is currently unavailable.",
            image: `https://financialmodelingprep.com/image-stock/${symbol}.png`,
            ipoDate: ""
        };
    }
};

export const fetchHistoricalData = async (
    symbol: string, 
    timeframe: string, 
    from?: string, 
    to?: string,
    predictiveParams?: {
        selectedIndicators: string[];
        walletAmount: string;
        selectedMarketType: string;
        includeOptionsAnalysis?: boolean;
        includeCallOptions?: boolean;
        includePutOptions?: boolean;
        includeOrderAnalysis?: boolean;
        selectedNonTechnicalIndicators?: string[];
    }
): Promise<HistoricalDataPoint[]> => {
    // First, try to fetch real historical data
    let historicalData: HistoricalDataPoint[] = [];

    if (FMP_API_KEY) {
        try {
            const endpoint = getTimeframeEndpoint(timeframe);
            let url;

            if (endpoint === 'historical-chart') {
                // For intraday data - use the format: /historical-chart/interval/symbol
                const interval = getTimeframeInterval(timeframe);
                url = `${FMP_BASE_URL}/${endpoint}/${interval}/${symbol}`;

                // Build query parameters properly
                const params = new URLSearchParams();
                params.append('apikey', FMP_API_KEY);

                if (from && to) {
                    // Only fetch up to today for real data
                    const today = new Date().toISOString().split('T')[0];
                    const endDate = to && to <= today ? to : today;
                    params.append('from', from);
                    params.append('to', endDate);
                }

                url += `?${params.toString()}`;
            } else {
                // For daily and longer timeframes
                url = `${FMP_BASE_URL}/${endpoint}/${symbol}`;

                const params = new URLSearchParams();
                params.append('apikey', FMP_API_KEY);

                if (from && to) {
                    // Only fetch up to today for real data
                    const today = new Date().toISOString().split('T')[0];
                    const endDate = to && to <= today ? to : today;
                    params.append('from', from);
                    params.append('to', endDate);
                }

                url += `?${params.toString()}`;
            }

            // Add timeout for faster fallback
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch(url, { 
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();

                let apiData;
                if (endpoint === 'historical-chart') {
                    apiData = data;
                } else {
                    apiData = data.historical;
                }

                if (apiData && Array.isArray(apiData) && apiData.length > 0) {
                    // Transform and sort data
                    historicalData = apiData.map((d: any) => ({
                        date: d.date || new Date().toISOString().split('T')[0],
                        open: Number(d.open || d.close || 0),
                        high: Number(d.high || d.close || 0),
                        low: Number(d.low || d.close || 0),
                        close: Number(d.close || 0),
                        volume: Number(d.volume || 0),
                        openInterest: Number(d.openInterest || Math.floor(Math.random() * 500000) + 100000)
                    })).filter(d => d.close > 0).reverse();

                    console.log(`Successfully fetched ${historicalData.length} real data points for ${symbol} (${timeframe})`);
                } else {
                    console.warn(`No data returned from FMP API for ${symbol} (${timeframe}). Response:`, data);
                }
            } else {
                console.warn(`FMP API returned ${response.status}: ${response.statusText} for ${symbol} (${timeframe})`);
                if (response.status === 403) {
                    console.warn(`❌ API access denied for ${timeframe} - this timeframe requires a paid FMP plan`);
                } else if (response.status === 401) {
                    console.warn(`❌ API key unauthorized for ${timeframe} - check API key validity`);
                } else if (response.status === 429) {
                    console.warn(`❌ API rate limit exceeded for ${timeframe}`);
                }

                // Log the full URL for debugging
                console.log(`🔍 Debug URL: ${url.replace(FMP_API_KEY, 'API_KEY_HIDDEN')}`);

                // For 30m specifically, provide more context
                if (timeframe === '30m') {
                    console.warn(`⚠️  30-minute data typically requires FMP's Essential plan or higher`);
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn(`Request timeout for ${symbol} (${timeframe}), falling back to mock data`);
            } else {
                console.warn(`Failed to fetch real data for ${symbol} (${timeframe}), falling back to mock data:`, error);
            }
        }
    }

    // If no real data was fetched, generate mock data
    if (historicalData.length === 0) {
        console.log(`Using mock data for ${symbol}`);
        historicalData = generateMockData(symbol, timeframe);
    }

    // If we have a future end date and predictive parameters, extend with predictions
    if (to && predictiveParams) {
        const { extendHistoricalDataWithPrediction } = await import('./predictiveAnalysisService.ts');

        const extended = extendHistoricalDataWithPrediction(
            historicalData,
            from || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            to,
            predictiveParams
        );

        if (extended.isPredictive) {
            console.log(`Extended data with ${extended.predictiveData.length} predictive points for ${symbol}`);
            return [...extended.historicalData, ...extended.predictiveData];
        }
    }

    return historicalData;
};