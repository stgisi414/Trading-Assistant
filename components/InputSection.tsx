import React from 'react';
import type { IndicatorOption } from '../types.ts';
import { Spinner } from './Spinner.tsx';
import { SymbolSearchInput } from './SymbolSearchInput.tsx';

interface InputSectionProps {
    selectedSymbols: string[];
    setSelectedSymbols: (symbols: string[]) => void;
    walletAmount: string;
    setWalletAmount: (value: string) => void;
    startDate: string;
    setStartDate: (date: string) => void;
    endDate: string;
    setEndDate: (date: string) => void;
    selectedIndicators: string[];
    setSelectedIndicators: (values: string[]) => void;
    indicatorOptions: IndicatorOption[];
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
    onAnalyze,
    isLoading
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
                </div>
            </div>

            <div className="mt-8">
                <button
                    onClick={onAnalyze}
                    disabled={isLoading || selectedSymbols.length === 0}
                    className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                    {isLoading ? <><Spinner className="text-white" /> Analyzing...</> : `Analyze ${selectedSymbols.length || 0} Asset(s)`}
                </button>
            </div>
        </section>
    );
};