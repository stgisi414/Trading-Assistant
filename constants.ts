import type { IndicatorOption, TimeframeOption } from './types.ts';

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