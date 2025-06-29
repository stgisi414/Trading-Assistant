import React from 'react';
import type { IndicatorOption, TimeframeOption, MarketOption } from '../types.ts';
import { MarketType } from '../types.ts';
import { SymbolSearchInput } from './SymbolSearchInput.tsx';
import { Spinner } from './Spinner.tsx';

interface InputSectionProps {
    selectedSymbols: string[];
    setSelectedSymbols: (symbols: string[]) => void;
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
    onAnalyze: () => void;
    isLoading: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({
    selectedSymbols, setSelectedSymbols, walletAmount, setWalletAmount,
    startDate, setStartDate, endDate, setEndDate,
    selectedIndicators, setSelectedIndicators, indicatorOptions,
    selectedNonTechnicalIndicators, setSelectedNonTechnicalIndicators, nonTechnicalIndicatorOptions,
    selectedTimeframe, setSelectedTimeframe, timeframeOptions,
    selectedMarketType, setSelectedMarketType, selectedMarket, setSelectedMarket, marketOptions,
    includeOptionsAnalysis, setIncludeOptionsAnalysis,
    includeCallOptions, setIncludeCallOptions,
    includePutOptions, setIncludePutOptions,
    includeOrderAnalysis, setIncludeOrderAnalysis,
    onAnalyze, isLoading
}) => {
    const handleIndicatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions, option => option.value);
        setSelectedIndicators(selected);
    };

    const handleNonTechnicalIndicatorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions, option => option.value);
        setSelectedNonTechnicalIndicators(selected);
    };

    const handleAddSymbol = (symbol: string) => {
        if (!selectedSymbols.includes(symbol)) {
            setSelectedSymbols([...selectedSymbols, symbol]);
        }
    };

    const handleRemoveSymbol = (symbolToRemove: string) => {
        setSelectedSymbols(selectedSymbols.filter(symbol => symbol !== symbolToRemove));
    };

    const inputClasses = "w-full p-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";
    const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

    return (
        <section>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-4 gap-y-6 items-start">
                <div className="flex flex-col gap-6 lg:col-span-1">
                    <div>
                        <label htmlFor="marketTypeSelect" className={labelClasses}>Market Type</label>
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
                        <label htmlFor="marketSelect" className={labelClasses}>Market</label>
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
                    />
                    <div>
                        <label htmlFor="walletAmount" className={labelClasses}>Trading Wallet Amount ($)</label>
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
                                className={inputClasses}
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className={labelClasses}>End Date</label>
                            <input
                                type="date"
                                id="endDate"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className={inputClasses}
                                disabled={isLoading}
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
                                <div>
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
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8">
                <button
                    onClick={onAnalyze}
                    disabled={isLoading || selectedSymbols.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:bg-gray-400 disabled:text-gray-200 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center gap-3 text-lg"
                >
                    {isLoading ? <><Spinner className="text-white" /> Analyzing...</> : `Analyze ${selectedSymbols.length || 0} Asset(s)`}
                </button>
            </div>
        </section>
    );
};