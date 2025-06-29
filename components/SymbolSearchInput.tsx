import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchSymbols } from '../services/marketDataService.ts';
import type { FmpSearchResult } from '../types.ts';
import { Spinner } from './Spinner.tsx';
import { MARKET_OPTIONS } from '../constants';

interface SymbolSearchInputProps {
    selectedSymbols: FmpSearchResult[];
    onAddSymbol: (symbol: FmpSearchResult) => void;
    onRemoveSymbol: (symbol: string) => void;
    isDisabled: boolean;
    marketType?: string;
    market?: string;
}

export const SymbolSearchInput: React.FC<SymbolSearchInputProps> = ({ selectedSymbols, onAddSymbol, onRemoveSymbol, isDisabled, marketType, market }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<FmpSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const getSymbolsForMarket = useCallback(() => {
        if (marketType && market && MARKET_OPTIONS[marketType]) {
            const marketData = MARKET_OPTIONS[marketType].find(m => m.value === market);
            return marketData ? marketData.symbols : [];
        }
        return [];
    }, [marketType, market]);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchResults = useCallback(async (currentQuery: string) => {
        setIsSearching(true);
        const symbols = getSymbolsForMarket();
        let data: FmpSearchResult[] = [];
        
        if (symbols.length > 0) {
            // Filter from predefined symbols for specific markets
            data = symbols
                .filter(s => s.symbol.toLowerCase().includes(currentQuery.toLowerCase()) || s.name.toLowerCase().includes(currentQuery.toLowerCase()))
                .map(s => ({ symbol: s.symbol, name: s.name }));
        } else if (marketType === 'STOCKS') {
            // Allow general symbol search for STOCKS market type (includes NYSE/NASDAQ)
            data = await searchSymbols(currentQuery);
        }
        // For other market types without predefined symbols, no search results
        
        setResults(data);
        setIsSearching(false);
    }, [getSymbolsForMarket, marketType]);

    useEffect(() => {
        if (query.length < 1) {
            setResults([]);
            setIsDropdownOpen(false);
            return;
        }

        setIsDropdownOpen(true);
        const debounce = setTimeout(() => {
            fetchResults(query);
        }, 300);

        return () => clearTimeout(debounce);
    }, [query, fetchResults]);

    const handleAdd = (result: FmpSearchResult) => {
        if (!selectedSymbols.find(s => s.symbol === result.symbol)) {
            onAddSymbol(result);
        }
        setQuery('');
        setResults([]);
        setIsDropdownOpen(false);
    };

    const inputClasses = "w-full p-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";

    return (
        <div className="flex flex-col gap-4">
            <div>
                <label htmlFor="assetSymbol" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Asset Symbols
                    {marketType === 'STOCKS' ? ' (e.g., AAPL, TSLA)' : ''}
                </label>
                {marketType !== 'STOCKS' && getSymbolsForMarket().length === 0 && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 mb-2">
                        This market selection doesn't have predefined symbols. Please select a different market.
                    </p>
                )}
                <div ref={containerRef} className="relative">
                    <input
                        type="text"
                        id="assetSymbol"
                        value={query}
                        onChange={(e) => setQuery(e.target.value.toUpperCase())}
                        onFocus={() => query && setIsDropdownOpen(true)}
                        placeholder={
                            marketType === 'STOCKS' 
                                ? "Type to search stocks..." 
                                : getSymbolsForMarket().length > 0 
                                    ? "Type to search available symbols..." 
                                    : "Please select a market with available symbols"
                        }
                        className={inputClasses}
                        disabled={isDisabled || (marketType !== 'STOCKS' && getSymbolsForMarket().length === 0)}
                        autoComplete="off"
                    />
                    {isDropdownOpen && (
                        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {isSearching ? (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                                  <Spinner className="text-indigo-500"/> Searching...
                                </div>
                            ) : results.length > 0 ? (
                                <ul>
                                    {results.map(res => (
                                        <li key={res.symbol}
                                            onClick={() => handleAdd(res)}
                                            className="px-4 py-2 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-gray-800 dark:text-gray-200">
                                            <span className="font-bold">{res.symbol}</span> - <span className="text-gray-600 dark:text-gray-400">{res.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                    {marketType !== 'STOCKS' && getSymbolsForMarket().length === 0 
                                        ? "No symbols available for this market selection" 
                                        : "No results found"}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[30px]">
                {selectedSymbols.map(symbolObj => (
                    <div key={symbolObj.symbol} className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-500/30 text-indigo-800 dark:text-indigo-200 text-sm font-medium pl-3 pr-2 py-1 rounded-full animate-in fade-in">
                        <span>{symbolObj.symbol}</span>
                        <button
                            onClick={() => onRemoveSymbol(symbolObj.symbol)}
                            disabled={isDisabled}
                            className="text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100 disabled:opacity-50 text-lg leading-none"
                            aria-label={`Remove ${symbolObj.symbol}`}
                        >
                            &times;
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};