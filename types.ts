export enum Position {
    BUY = 'BUY',
    SELL = 'SELL',
    HOLD = 'HOLD',
    NA = 'N/A'
}

export interface HistoricalDataPoint {
    date: string;
    close: number;
    open?: number;
    high?: number;
    low?: number;
    volume?: number;
    openInterest?: number;
}

export interface OpenInterestData {
    date: string;
    openInterest: number;
    change: number;
    percentChange: number;
}

export interface NewsArticle {
    title: string;
    uri: string;
    snippet: string;
    source?: string;
    images?: ImageResult[];
}

export interface ImageResult {
    url: string;
    title: string;
    source: 'google' | 'imagen3';
    thumbnail?: string;
    contextLink?: string;
}

export interface AnalysisResult {
    position: Position;
    confidence: string;
    reasoning: string;
    news: NewsArticle[];
    symbolLogo?: ImageResult[];
    reasoningIllustrations?: ImageResult[];
    optionsAnalysis?: OptionsAnalysis;
    orderAnalysis?: OrderAnalysis;
    openInterestAnalysis?: OpenInterestAnalysis;
    tenKAnalysis?: TenKAnalysis;
}

export interface TenKAnalysis {
    symbol: string;
    reportYear: string;
    businessOverview: string;
    riskFactors: string[];
    financialHighlights: {
        revenue: number;
        netIncome: number;
        eps: number;
        roe: number;
        debtToEquity: number;
    };
    managementDiscussion: string;
    competitivePosition: string;
    growthStrategy: string;
    keyMetrics: {
        profitMargin: number;
        assetTurnover: number;
        leverageRatio: number;
    };
    investmentRecommendation: string;
    analysisDate: string;
}

export interface OpenInterestAnalysis {
    currentOpenInterest: number;
    openInterestTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
    speculativeRatio: number;
    marketSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    analysis: string;
}

export interface OptionsAnalysis {
    callRecommendation?: OptionRecommendation;
    putRecommendation?: OptionRecommendation;
}

export interface OptionRecommendation {
    strike: number;
    expiration: string;
    premium: number;
    bid: number;
    ask: number;
    spread: number;
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

export interface MarketOption {
    value: string;
    label: string;
    region: string;
    currency: string;
}

export enum MarketType {
    STOCKS = 'STOCKS',
    COMMODITIES = 'COMMODITIES',
    CRYPTO = 'CRYPTO',
    FOREX = 'FOREX'
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

// Symbol search result from FMP API
export interface FmpSearchResult {
    symbol: string;
    name: string;
    currency: string;
    stockExchange: string;
    exchangeShortName: string;
}

// New type to hold all info for a single asset analysis
export interface PatternDetails {
    patternType: 'HeadAndShouldersTop' | 'HeadAndShouldersBottom' | 'DoubleTop' | 'DoubleBottom';
    confidence: number; // 0-100
    description: string;
    tradingImplications: string;
    keyLevels: {
        neckline?: number;
        support?: number;
        resistance?: number;
        targetPrice?: number;
    };
    timeframe: string;
    reliability: 'High' | 'Medium' | 'Low';
}

export interface CompanyProfile {
    symbol: string;
    companyName: string;
    ceo: string;
    website: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
    exchange: string;
    currency: string;
    industry: string;
    sector: string;
    employees: number;
    marketCap: number;
    description: string;
    image: string;
    ipoDate: string;
}

export interface AssetAnalysis {
    symbol: FmpSearchResult;
    historicalData: HistoricalDataPoint[];
    analysisResult: AnalysisResult | null;
    isLoading: boolean;
    error?: string;
    patternDetails?: PatternDetails[];
    companyProfile?: CompanyProfile | null;
}

// Authentication and Cloud Storage Types
export interface AuthUser {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
}

export interface UserSubscription {
    tier: 'free' | 'premium';
    analysisLimit: number;
    analysisCount: number;
    paperTradingEnabled: boolean;
    expiresAt?: Date;
}

export interface PaperTrade {
    id: string;
    userId: string;
    symbol: string;
    action: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    timestamp: Date;
    status: 'pending' | 'executed' | 'cancelled';
    reasoning?: string;
    stopLoss?: number;
    takeProfit?: number;
}

export interface CloudSyncStatus {
    lastSynced: Date;
    isOnline: boolean;
    pendingChanges: number;
}

export interface PaperTrade {
    id: string;
    userId: string;
    symbol: string;
    action: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    orderType: 'MARKET' | 'LIMIT';
    limitPrice?: number;
    stopLoss?: number;
    takeProfit?: number;
    reasoning?: string;
    timestamp: Date;
    status: 'pending' | 'active' | 'closed' | 'cancelled';
    closedAt?: Date;
    realizedPnL?: number;
    // Options trading fields
    isOptions?: boolean;
    optionType?: 'CALL' | 'PUT';
    strikePrice?: number;
    expirationDate?: Date;
    contractSize?: number; // Usually 100 shares per contract
}

export interface PaperTradingPosition {
    symbol: string;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    marketValue: number;
    unrealizedPnL: number;
    unrealizedPnLPercent: number;
    // Options trading fields
    isOptions?: boolean;
    optionType?: 'CALL' | 'PUT';
    strikePrice?: number;
    expirationDate?: Date;
    contractSize?: number;
    intrinsicValue?: number;
    timeValue?: number;
    impliedVolatility?: number;
    delta?: number;
    gamma?: number;
    theta?: number;
    vega?: number;
}

export interface PaperTradingPortfolio {
    userId: string;
    initialBalance: number;
    cashBalance: number;
    totalValue: number;
    positions: PaperTradingPosition[];
    createdAt: Date;
    updatedAt: Date;
}

export interface MarketData {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    timestamp: Date;
}

export interface OptionsChain {
    symbol: string;
    expirationDate: Date;
    calls: OptionContract[];
    puts: OptionContract[];
}

export interface OptionContract {
    strike: number;
    bid: number;
    ask: number;
    lastPrice: number;
    volume: number;
    openInterest: number;
    impliedVolatility: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    intrinsicValue: number;
    timeValue: number;
}