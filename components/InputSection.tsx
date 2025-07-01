import React from 'react';
import type { IndicatorOption, TimeframeOption, MarketOption } from '../types.ts';
import { MarketType } from '../types.ts';
import { SymbolSearchInput } from './SymbolSearchInput.tsx';
import { Spinner } from './Spinner.tsx';
import { analyzeIndicatorConfluence, type ConfluenceAnalysis } from '../services/confluenceAnalysisService.ts';

interface InputSectionProps {
    selectedSymbols: FmpSearchResult[];
    onAddSymbol: (symbol: FmpSearchResult) => void;
    onRemoveSymbol: (symbol: string) => void;
    walletAmount: string;
    setWalletAmount: (amount: string) => void;
    startDate: string;
    setStartDate: (date: string) => void;
    endDate: string;
    setEndDate: (date: string) => void;
    selectedIndicators: string[];
    setSelectedIndicators: (indicators: string[]) => void;
    indicatorOptions: IndicatorOption[];
    selectedNonTechnicalIndicators: string[];
    setSelectedNonTechnicalIndicators: (indicators: string[]) => void;
    nonTechnicalIndicatorOptions: IndicatorOption[];
    selectedTimeframe: string;
    setSelectedTimeframe: (timeframe: string) => void;
    timeframeOptions: TimeframeOption[];
    selectedMarketType: MarketType;
    setSelectedMarketType: (marketType: MarketType) => void;
    selectedMarket: string;
    setSelectedMarket: (market: string) => void;
    marketOptions: MarketOption[];
    includeOptionsAnalysis: boolean;
    setIncludeOptionsAnalysis: (include: boolean) => void;
    includeCallOptions: boolean;
    setIncludeCallOptions: (include: boolean) => void;
    includePutOptions: boolean;
    setIncludePutOptions: (include: boolean) => void;
    includeOrderAnalysis: boolean;
    setIncludeOrderAnalysis: (include: boolean) => void;
    include10KAnalysis: boolean;
    setInclude10KAnalysis: (include: boolean) => void;
    onAnalyze: () => void;
    isLoading: boolean;
    onProfitMaxClick: () => void;
    onClearResults: () => void;
    hasResults: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({
    selectedSymbols, onAddSymbol, onRemoveSymbol, walletAmount, setWalletAmount,
    startDate, setStartDate, endDate, setEndDate,
    selectedIndicators, setSelectedIndicators, indicatorOptions,
    selectedNonTechnicalIndicators, setSelectedNonTechnicalIndicators, nonTechnicalIndicatorOptions,
    selectedTimeframe, setSelectedTimeframe, timeframeOptions,
    selectedMarketType, setSelectedMarketType, selectedMarket, setSelectedMarket, marketOptions,
    includeOptionsAnalysis, setIncludeOptionsAnalysis,
    includeCallOptions, setIncludeCallOptions,
    includePutOptions, setIncludePutOptions,
    includeOrderAnalysis, setIncludeOrderAnalysis,
    include10KAnalysis, setInclude10KAnalysis,
    onAnalyze, isLoading, onProfitMaxClick, onClearResults, hasResults
}) => {
    const handleIndicatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions, option => option.value);
        setSelectedIndicators(selected);
    };

    const handleNonTechnicalIndicatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions, option => option.value);
        setSelectedNonTechnicalIndicators(selected);
    };

    const handleAddSymbol = (symbol: FmpSearchResult) => {
        onAddSymbol(symbol);
    };

    const handleRemoveSymbol = (symbolToRemove: string) => {
        onRemoveSymbol(symbolToRemove);
    };

    // Confluence analysis
    const [confluenceAnalysis, setConfluenceAnalysis] = React.useState<ConfluenceAnalysis | null>(null);

    React.useEffect(() => {
        if (selectedIndicators.length > 0) {
            const analysis = analyzeIndicatorConfluence(selectedIndicators);
            setConfluenceAnalysis(analysis);
        } else {
            setConfluenceAnalysis(null);
        }
    }, [selectedIndicators]);

    const inputClasses = `w-full p-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition [color-scheme:light] dark:[color-scheme:dark]`;
    const labelClasses = "block text-sm font-medium mb-1";
    const labelStyle = { color: 'var(--color-text-primary)' };

    return (
        <section>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-4 gap-y-6 items-start">
                <div className="flex flex-col gap-6 lg:col-span-1">
                    <div>
                        <label htmlFor="marketTypeSelect" className={labelClasses} style={labelStyle}>Market Type</label>
                        <select
                            id="marketTypeSelect"
                            value={selectedMarketType}
                            onChange={(e) => setSelectedMarketType(e.target.value as MarketType)}
                            className={inputClasses}
                            disabled={isLoading}
                        >
                            <option value={MarketType.STOCKS}>US Markets</option>
                            <option value={MarketType.COMMODITIES}>Commodities</option>
                            <option value={MarketType.CRYPTO}>Crypto</option>
                            <option value={MarketType.FOREX}>Forex</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="marketSelect" className={labelClasses} style={labelStyle}>Market</label>
                        <select
                            id="marketSelect"
                            value={selectedMarket || ''}
                            onChange={(e) => {
                                setSelectedMarket(e.target.value);
                            }}
                            className={inputClasses}
                            disabled={isLoading}
                        >
                            <option value="">Select a market</option>
                            {marketOptions && marketOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                    <SymbolSearchInput 
                        selectedSymbols={selectedSymbols} 
                        onAddSymbol={handleAddSymbol} 
                        onRemoveSymbol={handleRemoveSymbol}
                        isDisabled={isLoading}
                        marketType={selectedMarketType}
                        market={selectedMarket}
                    />
                    <div>
                        <label htmlFor="walletAmount" className={labelClasses} style={labelStyle}>Trading Wallet Amount ($)</label>
                        <input
                            type="number"
                            id="walletAmount"
                            value={walletAmount}
                            onChange={(e) => setWalletAmount(e.target.value)}
                            placeholder="10000"
                            className={inputClasses}
                            disabled={isLoading}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-6 lg:col-span-2">
                    <div>
                        <label htmlFor="indicatorSelect" className={labelClasses}>Technical Indicators (multi-select)</label>
                        <select
                            id="indicatorSelect"
                            multiple
                            value={selectedIndicators}
                            onChange={handleIndicatorChange}
                            className={`${inputClasses} h-40`}
                            disabled={isLoading}
                        >
                            {indicatorOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="nonTechnicalIndicatorSelect" className={labelClasses}>Non-Technical Indicators (multi-select)</label>
                        <select
                            id="nonTechnicalIndicatorSelect"
                            multiple
                            value={selectedNonTechnicalIndicators}
                            onChange={handleNonTechnicalIndicatorChange}
                            className={`${inputClasses} h-40`}
                            disabled={isLoading}
                        >
                            {nonTechnicalIndicatorOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startDate" className={labelClasses}>Start Date</label>
                            <input
                                type="date"
                                id="startDate"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className={`${inputClasses} ${selectedTimeframe !== 'custom' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={isLoading || selectedTimeframe !== 'custom'}
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className={labelClasses}>End Date</label>
                            <input
                                type="date"
                                id="endDate"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className={`${inputClasses} ${selectedTimeframe !== 'custom' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={isLoading || selectedTimeframe !== 'custom'}
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="timeframeSelect" className={labelClasses}>Timeframe</label>
                        <select
                            id="timeframeSelect"
                            value={selectedTimeframe}
                            onChange={(e) => setSelectedTimeframe(e.target.value)}
                            className={inputClasses}
                            disabled={isLoading}
                        >
                            {timeframeOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </div>
                <div>
                        <label className={labelClasses}>Analysis Options</label>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="includeOptionsAnalysis"
                                            checked={includeOptionsAnalysis}
                                            onChange={(e) => setIncludeOptionsAnalysis(e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            disabled={isLoading}
                                        />
                                        <label htmlFor="includeOptionsAnalysis" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Include Options Analysis
                                        </label>
                                    </div>
                                    {includeOptionsAnalysis && (
                                        <div className="ml-6 space-y-2">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="includeCallOptions"
                                                    checked={includeCallOptions}
                                                    onChange={(e) => setIncludeCallOptions(e.target.checked)}
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                    disabled={isLoading}
                                                />
                                                <label htmlFor="includeCallOptions" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                                    Call Options
                                                </label>
                                            </div>
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="includePutOptions"
                                                    checked={includePutOptions}
                                                    onChange={(e) => setIncludePutOptions(e.target.checked)}
                                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                    disabled={isLoading}
                                                />
                                                <label htmlFor="includePutOptions" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                                    Put Options
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="includeOrderAnalysis"
                                            checked={includeOrderAnalysis}
                                            onChange={(e) => setIncludeOrderAnalysis(e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            disabled={isLoading}
                                        />
                                        <label htmlFor="includeOrderAnalysis" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Include Stop & Limit Order Analysis
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="include10KAnalysis"
                                            checked={include10KAnalysis}
                                            onChange={(e) => setInclude10KAnalysis(e.target.checked)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            disabled={isLoading}
                                        />
                                        <label htmlFor="include10KAnalysis" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Include 10-K Fundamental Analysis
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

             {/* Confluence Analysis Display */}
             {confluenceAnalysis && selectedIndicators.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        📊 Indicator Confluence Analysis
                    </h3>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Overall Score */}
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                    {confluenceAnalysis.overallScore.toFixed(0)}%
                                </div>
                                <div className={`text-sm font-medium ${
                                    confluenceAnalysis.equilibriumStatus === 'Optimal' ? 'text-green-600 dark:text-green-400' :
                                    confluenceAnalysis.equilibriumStatus === 'Good' ? 'text-blue-600 dark:text-blue-400' :
                                    confluenceAnalysis.equilibriumStatus === 'Imbalanced' ? 'text-yellow-600 dark:text-yellow-400' :
                                    'text-red-600 dark:text-red-400'
                                }`}>
                                    {confluenceAnalysis.equilibriumStatus} Equilibrium
                                </div>
                            </div>

                            {/* Category Breakdown */}
                            <div className="space-y-2">
                                <div className="text-xs text-gray-600 dark:text-gray-400">Category Coverage:</div>
                                {Object.entries(confluenceAnalysis.categoryScores).map(([category, score]) => (
                                    <div key={category} className="flex items-center justify-between text-xs">
                                        <span className="capitalize" style={{ color: 'var(--color-text-primary)' }}>
                                            {category === 'trend' ? '📈 Trend' :
                                             category === 'momentum' ? '🚀 Momentum' :
                                             category === 'volatility' ? '📊 Volatility' : '📦 Volume'}
                                        </span>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                                <div 
                                                    className={`h-1.5 rounded-full ${
                                                        score >= 80 ? 'bg-green-500' :
                                                        score >= 60 ? 'bg-blue-500' :
                                                        score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${score}%` }}
                                                ></div>
                                                <span className="text-xs font-medium">{score.toFixed(0)}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recommendations */}
                        {confluenceAnalysis.recommendations.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-700">
                                <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                                    💡 Optimization Suggestions:
                                </div>
                                <div className="space-y-1">
                                    {confluenceAnalysis.recommendations.slice(0, 2).map((rec, index) => (
                                        <div key={index} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                            • {rec}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="mt-8">
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onProfitMaxClick}
                        disabled={isLoading}
                        className="btn-icon-mobile bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base md:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        {isLoading ? (
                            <>
                                <Spinner className="text-white" /> 
                                Optimizing...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                <span className="text-mobile-hidden">Signatex ProfitMax</span>
                            </>
                        )}
                    </button>
                    <button
                            onClick={onAnalyze}
                            disabled={isLoading || selectedSymbols.length === 0}
                            className="flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base md:text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span className="hidden sm:inline">Analyzing...</span>
                                </>
                            ) : (
                                <>
                                    <svg
                                        className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        />
                                    </svg>
                                    <span className="text-mobile-hidden">Analyze</span>
                                </>
                            )}
                        </button>
                    {hasResults && (
                        <button
                            onClick={onClearResults}
                            disabled={isLoading}
                            className="btn-icon-mobile bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base md:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="text-mobile-hidden">Clear Results</span>
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
};