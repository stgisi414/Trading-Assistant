
import React from 'react';
import type { OptimizationResult } from '../services/profitMaxService.ts';
import { Position } from '../types.ts';

interface ProfitMaxResultsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyResults: () => void;
    result: OptimizationResult | null;
}

export const ProfitMaxResultsModal: React.FC<ProfitMaxResultsModalProps> = ({
    isOpen,
    onClose,
    onApplyResults,
    result
}) => {
    if (!isOpen || !result) return null;

    const getPositionColor = (position: Position) => {
        switch (position) {
            case Position.BUY:
                return 'text-green-600 dark:text-green-400';
            case Position.SELL:
                return 'text-red-600 dark:text-red-400';
            case Position.HOLD:
                return 'text-yellow-600 dark:text-yellow-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    };

    const getProfitColor = (profit: number) => {
        if (profit > 0) return 'text-green-600 dark:text-green-400';
        if (profit < 0) return 'text-red-600 dark:text-red-400';
        return 'text-gray-600 dark:text-gray-400';
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">✓</span>
                                </div>
                                ProfitMax Optimization Complete
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Optimal trading configuration found
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
                            <div className="text-green-100 text-sm">Expected Profit</div>
                            <div className="text-2xl font-bold">
                                {result.expectedProfitPercentage > 0 ? '+' : ''}{result.expectedProfitPercentage.toFixed(2)}%
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
                            <div className="text-blue-100 text-sm">Confidence</div>
                            <div className="text-2xl font-bold">{result.confidence.toFixed(1)}%</div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
                            <div className="text-purple-100 text-sm">Optimal Wallet</div>
                            <div className="text-xl font-bold">${result.bestWalletAmount.toLocaleString()}</div>
                        </div>
                        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg p-4">
                            <div className="text-indigo-100 text-sm">Best Timeframe</div>
                            <div className="text-xl font-bold">{result.bestTimeframe}</div>
                        </div>
                    </div>

                    {/* Optimal Configuration */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            📊 Optimal Configuration
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Best Symbols ({result.bestSymbols.length})</h4>
                                <div className="space-y-2">
                                    {result.bestSymbols.map(symbol => (
                                        <div key={symbol.symbol} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg">
                                            <div>
                                                <span className="font-medium text-gray-900 dark:text-white">{symbol.symbol}</span>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">{symbol.name}</div>
                                            </div>
                                            {result.analyses.find(a => a.symbol === symbol.symbol)?.analysisResult && (
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${getPositionColor(result.analyses.find(a => a.symbol === symbol.symbol)?.analysisResult?.position)}`}>
                                                    {result.analyses.find(a => a.symbol === symbol.symbol)?.analysisResult?.position}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Best Indicators</h4>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {result.bestIndicators.map(indicator => (
                                        <span key={indicator} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 rounded-full text-sm">
                                            {indicator}
                                        </span>
                                    ))}
                                </div>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">Optimization Stats</h5>
                                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <div>Symbols analyzed: {result.optimizationDetails.symbolsAnalyzed}</div>
                                        <div>Timeframes tested: {result.optimizationDetails.timeframesAnalyzed}</div>
                                        <div>Indicator combos: {result.optimizationDetails.indicatorCombinationsAnalyzed}</div>
                                        <div>Total analyses: {result.optimizationDetails.totalAnalyses}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Analysis Results */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            📈 Individual Symbol Analysis
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {result.analyses.map(analysis => (
                                <div key={analysis.symbol} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">{analysis.symbol}</h4>
                                        {analysis.analysisResult && (
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPositionColor(analysis.analysisResult.position)}`}>
                                                {analysis.analysisResult.position}
                                            </span>
                                        )}
                                    </div>
                                    {analysis.analysisResult ? (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{analysis.analysisResult.confidence}</span>
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                                                {analysis.analysisResult.reasoning.substring(0, 100)}...
                                            </div>
                                        </div>
                                    ) : analysis.error ? (
                                        <div className="text-xs text-red-600 dark:text-red-400">{analysis.error}</div>
                                    ) : (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">No analysis available</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        💡 Tip: This configuration has been optimized for maximum profit potential based on current market conditions.
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => {
                                onApplyResults();
                                onClose();
                            }}
                            className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 flex items-center gap-2"
                        >
                            <span>✓</span>
                            Apply Configuration
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
