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
}

export interface IndicatorOption {
    value: string;
    label: string;
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