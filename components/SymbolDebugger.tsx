
import React, { useState, useEffect } from 'react';
import { MarketType } from '../types.ts';
import type { FmpSearchResult } from '../types.ts';

interface SymbolDebuggerProps {
    selectedSymbols: FmpSearchResult[];
    currentMarketType: MarketType;
    currentMarket: string;
    onAddSymbol: (symbol: FmpSearchResult) => void;
    onRemoveSymbol: (symbol: string) => void;
}

interface DebugLog {
    timestamp: string;
    type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
    message: string;
    data?: any;
}

export const SymbolDebugger: React.FC<SymbolDebuggerProps> = ({
    selectedSymbols,
    currentMarketType,
    currentMarket,
    onAddSymbol,
    onRemoveSymbol
}) => {
    const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
    const [isEnabled, setIsEnabled] = useState(false);
    const [testSymbol, setTestSymbol] = useState('AAPL');

    const addLog = (type: DebugLog['type'], message: string, data?: any) => {
        const log: DebugLog = {
            timestamp: new Date().toISOString(),
            type,
            message,
            data
        };
        setDebugLogs(prev => [log, ...prev].slice(0, 50)); // Keep last 50 logs
        console.log(`[SymbolDebugger ${type}]`, message, data);
    };

    // Monitor selectedSymbols changes
    useEffect(() => {
        if (isEnabled) {
            addLog('INFO', 'Selected symbols changed', {
                count: selectedSymbols.length,
                symbols: selectedSymbols.map(s => ({ symbol: s.symbol, name: s.name })),
                marketType: currentMarketType,
                market: currentMarket
            });
        }
    }, [selectedSymbols, isEnabled]);

    // Monitor market changes
    useEffect(() => {
        if (isEnabled) {
            addLog('INFO', 'Market configuration changed', {
                marketType: currentMarketType,
                market: currentMarket
            });
        }
    }, [currentMarketType, currentMarket, isEnabled]);

    const testAddSymbol = () => {
        addLog('INFO', `Testing symbol addition: ${testSymbol}`);
        
        try {
            // Check if symbol already exists
            const existingSymbol = selectedSymbols.find(s => s.symbol === testSymbol);
            if (existingSymbol) {
                addLog('WARNING', `Symbol ${testSymbol} already exists`, existingSymbol);
                return;
            }

            // Create test symbol
            const symbolToAdd: FmpSearchResult = {
                symbol: testSymbol,
                name: `${testSymbol} Test Corporation`
            };

            addLog('INFO', 'Calling onAddSymbol function', symbolToAdd);
            
            // Call the add function
            onAddSymbol(symbolToAdd);
            
            addLog('SUCCESS', 'onAddSymbol called successfully', symbolToAdd);
            
            // Check if it was actually added after a short delay
            setTimeout(() => {
                const wasAdded = selectedSymbols.find(s => s.symbol === testSymbol);
                if (wasAdded) {
                    addLog('SUCCESS', `Symbol ${testSymbol} successfully added to state`, wasAdded);
                } else {
                    addLog('ERROR', `Symbol ${testSymbol} was NOT added to state despite onAddSymbol call`);
                }
            }, 100);
            
        } catch (error) {
            addLog('ERROR', 'Error during symbol addition', error);
        }
    };

    const testRemoveSymbol = () => {
        if (selectedSymbols.length === 0) {
            addLog('WARNING', 'No symbols to remove');
            return;
        }

        const symbolToRemove = selectedSymbols[0].symbol;
        addLog('INFO', `Testing symbol removal: ${symbolToRemove}`);
        
        try {
            onRemoveSymbol(symbolToRemove);
            addLog('SUCCESS', 'onRemoveSymbol called successfully', symbolToRemove);
            
            setTimeout(() => {
                const stillExists = selectedSymbols.find(s => s.symbol === symbolToRemove);
                if (!stillExists) {
                    addLog('SUCCESS', `Symbol ${symbolToRemove} successfully removed from state`);
                } else {
                    addLog('ERROR', `Symbol ${symbolToRemove} still exists despite onRemoveSymbol call`);
                }
            }, 100);
            
        } catch (error) {
            addLog('ERROR', 'Error during symbol removal', error);
        }
    };

    const inspectAppState = () => {
        addLog('INFO', 'Current App State Inspection', {
            selectedSymbols: {
                count: selectedSymbols.length,
                symbols: selectedSymbols,
                types: selectedSymbols.map(s => typeof s),
                isArray: Array.isArray(selectedSymbols)
            },
            currentMarketType,
            currentMarket,
            localStorage: {
                selectedSymbols: localStorage.getItem('tradingApp_selectedSymbols'),
                marketType: localStorage.getItem('tradingApp_selectedMarketType'),
                market: localStorage.getItem('tradingApp_selectedMarket')
            },
            functions: {
                onAddSymbol: typeof onAddSymbol,
                onRemoveSymbol: typeof onRemoveSymbol
            }
        });
    };

    const clearLogs = () => {
        setDebugLogs([]);
        addLog('INFO', 'Debug logs cleared');
    };

    const getLogColor = (type: DebugLog['type']) => {
        switch (type) {
            case 'ERROR': return 'text-red-600 dark:text-red-400';
            case 'WARNING': return 'text-yellow-600 dark:text-yellow-400';
            case 'SUCCESS': return 'text-green-600 dark:text-green-400';
            default: return 'text-blue-600 dark:text-blue-400';
        }
    };

    if (!isEnabled) {
        return (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                            🔧 Symbol Addition Debugger
                        </h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Enable to track symbol addition/removal operations in real-time
                        </p>
                    </div>
                    <button
                        onClick={() => setIsEnabled(true)}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                    >
                        Enable Debug Mode
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    🔧 Symbol Addition Debugger (ACTIVE)
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={clearLogs}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                    >
                        Clear Logs
                    </button>
                    <button
                        onClick={() => setIsEnabled(false)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                        Disable
                    </button>
                </div>
            </div>

            {/* Test Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={testSymbol}
                        onChange={(e) => setTestSymbol(e.target.value.toUpperCase())}
                        placeholder="Symbol to test"
                        className="flex-1 px-3 py-2 text-sm border rounded"
                    />
                </div>
                <button
                    onClick={testAddSymbol}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                    Test Add Symbol
                </button>
                <button
                    onClick={testRemoveSymbol}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    disabled={selectedSymbols.length === 0}
                >
                    Test Remove Symbol
                </button>
                <button
                    onClick={inspectAppState}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                    Inspect State
                </button>
            </div>

            {/* Current State Display */}
            <div className="bg-white dark:bg-gray-700 rounded p-3 text-sm">
                <h4 className="font-semibold mb-2">Current State:</h4>
                <div className="space-y-1">
                    <div><strong>Symbols Count:</strong> {selectedSymbols.length}</div>
                    <div><strong>Market Type:</strong> {currentMarketType}</div>
                    <div><strong>Market:</strong> {currentMarket}</div>
                    <div><strong>Symbols:</strong> {selectedSymbols.map(s => s.symbol).join(', ') || 'None'}</div>
                </div>
            </div>

            {/* Debug Logs */}
            <div className="bg-black text-green-400 rounded p-3 font-mono text-xs max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-green-300 font-bold">DEBUG CONSOLE ({debugLogs.length} logs)</span>
                </div>
                {debugLogs.length === 0 ? (
                    <div className="text-gray-500">No logs yet... waiting for symbol operations...</div>
                ) : (
                    debugLogs.map((log, index) => (
                        <div key={index} className="mb-2 border-b border-gray-700 pb-1">
                            <div className="flex gap-2">
                                <span className="text-gray-400">{log.timestamp.split('T')[1].split('.')[0]}</span>
                                <span className={`font-bold ${getLogColor(log.type)}`}>[{log.type}]</span>
                                <span className="text-white">{log.message}</span>
                            </div>
                            {log.data && (
                                <div className="ml-4 text-yellow-300 text-xs">
                                    {JSON.stringify(log.data, null, 2)}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
