import React from 'react';
import type { IndicatorOption } from '../types.ts';
import { Spinner } from './Spinner.tsx';
import { SymbolSearchInput } from './SymbolSearchInput.tsx';

interface TimeframeOption {
    value: string;
    label: string;
}

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
    selectedTimeframe: string;
    setSelectedTimeframe: (timeframe: string) => void;
    timeframeOptions: TimeframeOption[];
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
    selectedSymbols,
    setSelectedSymbols,
    walletAmount,
    setWalletAmount,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedIndicators,
    setSelectedIndicators,
    indicatorOptions,
    selectedTimeframe,
    setSelectedTimeframe,
    timeframeOptions,
    includeOptionsAnalysis,
    setIncludeOptionsAnalysis,
    includeCallOptions,
    setIncludeCallOptions,
    includePutOptions,
    setIncludePutOptions,
    includeOrderAnalysis,
    setIncludeOrderAnalysis,
    onAnalyze,
    isLoading,
}) => {
    const handleIndicatorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const options = Array.from(event.target.selectedOptions, option => option.value);
        setSelectedIndicators(options);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 items-start">
                <div className="flex flex-col gap-6">
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

                <div className="flex flex-col gap-6">
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
                </div>

                <div className="mt-6 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Analysis Options</h3>
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

            <div className="mt-8">
                <button
                    onClick={onAnalyze}
                    disabled={isLoading || selectedSymbols.length === 0}
                    className="w-full bg-gradient-to-r from-indigo-600 via-amber-600 to-blue-600 hover:from-indigo-500 hover:via-amber-500 hover:to-blue-500 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl shadow-2xl hover:shadow-indigo-500/25 disabled:shadow-none transition-all duration-300 flex items-center justify-center gap-2 animate-glow hover:scale-105 relative overflow-hidden group sharp-corners"
                >
                    {isLoading ? <><Spinner className="text-white" /> Analyzing...</> : `Analyze ${selectedSymbols.length || 0} Asset(s)`}
                </button>
            </div>
        </section>
    );
};