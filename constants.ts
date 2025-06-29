import type { IndicatorOption, TimeframeOption, MarketOption } from './types.ts';

export const INDICATOR_OPTIONS: IndicatorOption[] = [
    { value: 'SMA', label: 'Simple Moving Average (SMA)' },
    { value: 'EMA', label: 'Exponential Moving Average (EMA)' },
    { value: 'RSI', label: 'Relative Strength Index (RSI)' },
    { value: 'MACD', label: 'Moving Average Convergence Divergence (MACD)' },
    { value: 'BollingerBands', label: 'Bollinger Bands' },
    { value: 'StochasticOscillator', label: 'Stochastic Oscillator' },
    { value: 'ADX', label: 'Average Directional Index (ADX)' },
    { value: 'Volume', label: 'Volume' },
    { value: 'Volatility', label: 'Volatility' },
    { value: 'HeadAndShouldersTop', label: 'Head and Shoulders Top Pattern' },
    { value: 'HeadAndShouldersBottom', label: 'Head and Shoulders Bottom (Inverse H&S)' },
    { value: 'DoubleTop', label: 'Double Top Pattern' },
    { value: 'DoubleBottom', label: 'Double Bottom Pattern' },
    { value: 'OpenInterest', label: 'Open Interest' },
];

export const NON_TECHNICAL_INDICATOR_OPTIONS: IndicatorOption[] = [
    { value: 'PE_Ratio', label: 'Price-to-Earnings Ratio (P/E)' },
    { value: 'PEG_Ratio', label: 'Price/Earnings to Growth (PEG)' },
    { value: 'Price_to_Book', label: 'Price-to-Book Ratio (P/B)' },
    { value: 'Debt_to_Equity', label: 'Debt-to-Equity Ratio' },
    { value: 'ROE', label: 'Return on Equity (ROE)' },
    { value: 'Revenue_Growth', label: 'Revenue Growth Rate' },
    { value: 'Earnings_Growth', label: 'Earnings Growth Rate' },
    { value: 'Free_Cash_Flow', label: 'Free Cash Flow' },
    { value: 'Analyst_Ratings', label: 'Analyst Ratings & Price Targets' },
    { value: 'Insider_Trading', label: 'Insider Trading Activity' },
    { value: 'Social_Sentiment', label: 'Social Media Sentiment' },
    { value: 'Economic_Indicators', label: 'Economic Indicators' },
    { value: 'Sector_Performance', label: 'Sector Relative Performance' },
];

export const TIMEFRAME_OPTIONS: TimeframeOption[] = [
    // Minutes
    { value: '5m', label: '5 Minutes', duration: 5 },
    { value: '15m', label: '15 Minutes', duration: 15 },
    { value: '30m', label: '30 Minutes', duration: 30 },

    // Hours
    { value: '1h', label: '1 Hour', duration: 60 },
    { value: '4h', label: '4 Hours', duration: 240 },
    { value: '12h', label: '12 Hours', duration: 720 },

    // Days
    { value: '1d', label: '1 Day', duration: 1440 },
    { value: '3d', label: '3 Days', duration: 4320 },
    { value: '7d', label: '1 Week', duration: 10080 },

    // Weeks
    { value: '2w', label: '2 Weeks', duration: 20160 },
    { value: '1M', label: '1 Month', duration: 43200 }, // ~30 days

    // Months
    { value: '3M', label: '3 Months', duration: 129600 }, // ~90 days
    { value: '6M', label: '6 Months', duration: 259200 }, // ~180 days

    // Years
    { value: '1Y', label: '1 Year', duration: 525600 }, // ~365 days
    { value: '2Y', label: '2 Years', duration: 1051200 }, // ~730 days
    { value: '5Y', label: '5 Years', duration: 2628000 }, // ~1825 days
];

export const MARKET_OPTIONS: { [key: string]: MarketOption[] } = {
    STOCKS: [
        { value: 'US', label: 'United States (NASDAQ/NYSE)', region: 'North America', currency: 'USD' },
        { value: 'CA', label: 'Canada (TSX)', region: 'North America', currency: 'CAD' },
        { value: 'UK', label: 'United Kingdom (LSE)', region: 'Europe', currency: 'GBP' },
        { value: 'DE', label: 'Germany (XETRA)', region: 'Europe', currency: 'EUR' },
        { value: 'FR', label: 'France (Euronext Paris)', region: 'Europe', currency: 'EUR' },
        { value: 'IT', label: 'Italy (Borsa Italiana)', region: 'Europe', currency: 'EUR' },
        { value: 'ES', label: 'Spain (BME)', region: 'Europe', currency: 'EUR' },
        { value: 'NL', label: 'Netherlands (Euronext Amsterdam)', region: 'Europe', currency: 'EUR' },
        { value: 'CH', label: 'Switzerland (SIX)', region: 'Europe', currency: 'CHF' },
        { value: 'SE', label: 'Sweden (Nasdaq Stockholm)', region: 'Europe', currency: 'SEK' },
        { value: 'JP', label: 'Japan (TSE)', region: 'Asia', currency: 'JPY' },
        { value: 'KR', label: 'South Korea (KOSPI/KOSDAQ)', region: 'Asia', currency: 'KRW' },
        { value: 'CN', label: 'China (SSE/SZSE)', region: 'Asia', currency: 'CNY' },
        { value: 'HK', label: 'Hong Kong (HKEX)', region: 'Asia', currency: 'HKD' },
        { value: 'SG', label: 'Singapore (SGX)', region: 'Asia', currency: 'SGD' },
        { value: 'TW', label: 'Taiwan (TWSE)', region: 'Asia', currency: 'TWD' },
        { value: 'TH', label: 'Thailand (SET)', region: 'Asia', currency: 'THB' },
        { value: 'MY', label: 'Malaysia (Bursa Malaysia)', region: 'Asia', currency: 'MYR' },
        { value: 'ID', label: 'Indonesia (IDX)', region: 'Asia', currency: 'IDR' },
        { value: 'PH', label: 'Philippines (PSE)', region: 'Asia', currency: 'PHP' },
        { value: 'VN', label: 'Vietnam (HOSE/HNX)', region: 'Asia', currency: 'VND' },
        { value: 'IN', label: 'India (NSE/BSE)', region: 'Asia', currency: 'INR' },
        { value: 'AE', label: 'UAE (DFM/ADX)', region: 'Middle East', currency: 'AED' },
        { value: 'SA', label: 'Saudi Arabia (Tadawul)', region: 'Middle East', currency: 'SAR' },
        { value: 'QA', label: 'Qatar (QE)', region: 'Middle East', currency: 'QAR' },
        { value: 'KW', label: 'Kuwait (Boursa Kuwait)', region: 'Middle East', currency: 'KWD' },
        { value: 'EG', label: 'Egypt (EGX)', region: 'Middle East', currency: 'EGP' },
        { value: 'IL', label: 'Israel (TASE)', region: 'Middle East', currency: 'ILS' },
        { value: 'TR', label: 'Turkey (BIST)', region: 'Europe/Asia', currency: 'TRY' },
        { value: 'ZA', label: 'South Africa (JSE)', region: 'Africa', currency: 'ZAR' },
        { value: 'NG', label: 'Nigeria (NSE)', region: 'Africa', currency: 'NGN' },
        { value: 'KE', label: 'Kenya (NSE)', region: 'Africa', currency: 'KES' },
        { value: 'AU', label: 'Australia (ASX)', region: 'Oceania', currency: 'AUD' },
        { value: 'NZ', label: 'New Zealand (NZX)', region: 'Oceania', currency: 'NZD' },
        { value: 'BR', label: 'Brazil (B3)', region: 'South America', currency: 'BRL' },
        { value: 'MX', label: 'Mexico (BMV)', region: 'North America', currency: 'MXN' },
        { value: 'AR', label: 'Argentina (BYMA)', region: 'South America', currency: 'ARS' },
        { value: 'CL', label: 'Chile (BCS)', region: 'South America', currency: 'CLP' },
        { value: 'CO', label: 'Colombia (BVC)', region: 'South America', currency: 'COP' },
        { value: 'PE', label: 'Peru (BVL)', region: 'South America', currency: 'PEN' },
        { value: 'RU', label: 'Russia (MOEX)', region: 'Europe/Asia', currency: 'RUB' }
    ],
    COMMODITIES: [
        { value: 'ENERGY', label: 'Energy', region: 'Global', currency: 'USD', symbols: [
            { symbol: 'CL', name: 'Crude Oil' },
            { symbol: 'NG', name: 'Natural Gas' },
            { symbol: 'HO', name: 'Heating Oil' },
            { symbol: 'BRENT', name: 'Brent Crude' },
        ]},
        { value: 'METALS', label: 'Precious Metals', region: 'Global', currency: 'USD', symbols: [
            { symbol: 'GC', name: 'Gold' },
            { symbol: 'SI', name: 'Silver' },
            { symbol: 'PL', name: 'Platinum' },
            { symbol: 'PA', name: 'Palladium' },
        ]},
        { value: 'INDUSTRIAL', label: 'Industrial Metals', region: 'Global', currency: 'USD', symbols: [
            { symbol: 'HG', name: 'Copper' },
            { symbol: 'LME-ALU', name: 'Aluminum' },
            { symbol: 'LME-ZNC', name: 'Zinc' },
            { symbol: 'LME-TIN', name: 'Tin' },
        ]},
        { value: 'AGRICULTURE', label: 'Agriculture', region: 'Global', currency: 'USD', symbols: [
            { symbol: 'C', name: 'Corn' },
            { symbol: 'S', name: 'Soybeans' },
            { symbol: 'W', name: 'Wheat' },
            { symbol: 'KC', name: 'Coffee' },
            { symbol: 'CT', name: 'Cotton' },
            { symbol: 'SB', name: 'Sugar' },
        ]},
        { value: 'LIVESTOCK', label: 'Livestock', region: 'Global', currency: 'USD', symbols: [
            { symbol: 'LE', name: 'Live Cattle' },
            { symbol: 'HE', name: 'Lean Hogs' },
        ]},
    ],
    CRYPTO: [
        { value: 'BTC', label: 'Bitcoin', region: 'Global', currency: 'USD', symbols: [{ symbol: 'BTC', name: 'Bitcoin' }] },
        { value: 'ETH', label: 'Ethereum', region: 'Global', currency: 'USD', symbols: [{ symbol: 'ETH', name: 'Ethereum' }] },
        { value: 'Major', label: 'Major Cryptocurrencies', region: 'Global', currency: 'USD', symbols: [
            { symbol: 'BTC', name: 'Bitcoin' },
            { symbol: 'ETH', name: 'Ethereum' },
            { symbol: 'BNB', name: 'Binance Coin' },
            { symbol: 'SOL', name: 'Solana' },
            { symbol: 'XRP', name: 'XRP' },
        ]},
        { value: 'DeFi', label: 'DeFi Tokens', region: 'Global', currency: 'USD', symbols: [
            { symbol: 'UNI', name: 'Uniswap' },
            { symbol: 'AAVE', name: 'Aave' },
            { symbol: 'COMP', name: 'Compound' },
            { symbol: 'MKR', name: 'Maker' },
        ]},
        { value: 'NFT', label: 'NFT & Metaverse', region: 'Global', currency: 'USD', symbols: [
            { symbol: 'AXS', name: 'Axie Infinity' },
            { symbol: 'SAND', name: 'The Sandbox' },
            { symbol: 'MANA', name: 'Decentraland' },
        ]},
    ],
    FOREX: [
        { value: 'MAJOR', label: 'Major Pairs', region: 'Global', currency: 'USD', symbols: [
            { symbol: 'EURUSD', name: 'EUR/USD' },
            { symbol: 'GBPUSD', name: 'GBP/USD' },
            { symbol: 'USDJPY', name: 'USD/JPY' },
            { symbol: 'USDCAD', name: 'USD/CAD' },
            { symbol: 'AUDUSD', name: 'AUD/USD' },
        ]},
        { value: 'MINOR', label: 'Minor Pairs', region: 'Global', currency: 'Various', symbols: [
            { symbol: 'EURGBP', name: 'EUR/GBP' },
            { symbol: 'EURJPY', name: 'EUR/JPY' },
            { symbol: 'GBPJPY', name: 'GBP/JPY' },
            { symbol: 'AUDJPY', name: 'AUD/JPY' },
        ]},
        { value: 'EXOTIC', label: 'Exotic Pairs', region: 'Global', currency: 'Various', symbols: [
            { symbol: 'USDTRY', name: 'USD/TRY' },
            { symbol: 'USDZAR', name: 'USD/ZAR' },
            { symbol: 'USDMXN', name: 'USD/MXN' },
        ]},
    ]
};