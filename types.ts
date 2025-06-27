export enum Position {
    BUY = 'BUY',
    SELL = 'SELL',
    HOLD = 'HOLD',
    NA = 'N/A'
}

export interface HistoricalDataPoint {
    date: string;
    close: number;
}

export interface NewsArticle {
    title: string;
    uri: string;
    snippet?: string;
    source?: string;
}

export interface AnalysisResult {
    position: Position;
    confidence: string;
    reasoning: string;
    news: NewsArticle[];
    optionsAnalysis?: OptionsAnalysis;
    orderAnalysis?: OrderAnalysis;
}

export interface OptionsAnalysis {
    callRecommendation?: OptionRecommendation;
    putRecommendation?: OptionRecommendation;
}

export interface OptionRecommendation {
    strike: number;
    expiration: string;
    premium: number;
    reasoning: string;
}

export interface OrderAnalysis {
    stopLoss?: number;
    takeProfit?: number;
    limitOrders?: LimitOrder[];
}

export interface LimitOrder {
    type: 'BUY' | 'SELL';
    price: number;
    reasoning: string;
}

export interface IndicatorOption {
    value: string;
    label: string;
}

export interface TimeframeOption {
    value: string;
    label: string;
    duration: number; // in minutes
}

export enum TimeframeType {
    MINUTES = 'MINUTES',
    HOURS = 'HOURS', 
    DAYS = 'DAYS',
    WEEKS = 'WEEKS',
    MONTHS = 'MONTHS',
    YEARS = 'YEARS'
}

// New type for FMP search results
export interface FmpSearchResult {
    symbol: string;
    name: string;
}

// New type to hold all info for a single asset analysis
export interface AssetAnalysis {
    symbol: string;
    historicalData: HistoricalDataPoint[];
    analysisResult: AnalysisResult | null;
    isLoading: boolean;
    error?: string;
}