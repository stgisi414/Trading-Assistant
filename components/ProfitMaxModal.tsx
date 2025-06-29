
import React, { useState, useEffect } from 'react';
import { runProfitMaxOptimization, getProfitMaxRecommendations, type ProfitMaxConfig, type OptimizationResult } from '../services/profitMaxService.ts';
import { MarketType } from '../types.ts';
import { Spinner } from './Spinner.tsx';

interface ProfitMaxModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOptimizationComplete: (result: OptimizationResult) => void;
    currentMarketType: MarketType;
    currentMarket: string;
    currentIndicators: string[];
    currentWalletAmount: string;
}

export const ProfitMaxModal: React.FC<ProfitMaxModalProps> = ({
    isOpen,
    onClose,
    onOptimizationComplete,
    currentMarketType,
    currentMarket,
    currentIndicators,
    currentWalletAmount
}) => {
    const [selectedTier, setSelectedTier] = useState<'light' | 'pro' | 'ultra'>('pro');
    const [maxSymbols, setMaxSymbols] = useState(5);
    const [targetProfit, setTargetProfit] = useState(15);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [recommendations, setRecommendations] = useState<any>(null);

    useEffect(() => {
        if (isOpen) {
            loadRecommendations();
        }
    }, [isOpen, currentMarketType, currentMarket]);

    const loadRecommendations = async () => {
        try {
            const recs = await getProfitMaxRecommendations(currentMarketType, currentMarket);
            setRecommendations(recs);
        } catch (error) {
            console.error('Failed to load recommendations:', error);
        }
    };

    const handleOptimize = async () => {
        setIsOptimizing(true);
        setProgress(0);
        setStatus('Starting optimization...');

        try {
            const config: ProfitMaxConfig = {
                tier: selectedTier,
                userSelectedIndicators: currentIndicators,
                marketType: currentMarketType,
                market: currentMarket,
                initialWalletAmount: parseFloat(currentWalletAmount) || 10000,
                maxSymbols,
                targetProfitPercentage: targetProfit
            };

            const result = await runProfitMaxOptimization(config, (prog, stat) => {
                setProgress(prog);
                setStatus(stat);
            });

            onOptimizationComplete(result);
            onClose();
        } catch (error) {
            console.error('Optimization failed:', error);
            setStatus(`Optimization failed: ${error.message}`);
        } finally {
            setIsOptimizing(false);
        }
    };

    if (!isOpen) return null;

    const tierDescriptions = {
        light: { 
            name: 'Light', 
            description: 'Quick optimization (~2-5 minutes)', 
            color: 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-600',
            textColor: 'text-green-800 dark:text-green-200'
        },
        pro: { 
            name: 'Pro', 
            description: 'Comprehensive optimization (~5-15 minutes)', 
            color: 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-600',
            textColor: 'text-blue-800 dark:text-blue-200'
        },
        ultra: { 
            name: 'Ultra', 
            description: 'Maximum optimization (~15-30 minutes)', 
            color: 'bg-purple-100 dark:bg-purple-900/50 border-purple-300 dark:border-purple-600',
            textColor: 'text-purple-800 dark:text-purple-200'
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">⚡</span>
                                </div>
                                Signatex ProfitMax
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                AI-powered optimization to maximize your trading profits
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isOptimizing}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Optimization Tier Selection */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Optimization Tier
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(tierDescriptions).map(([tier, info]) => (
                                <div
                                    key={tier}
                                    className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${
                                        selectedTier === tier 
                                            ? info.color 
                                            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                    }`}
                                    onClick={() => setSelectedTier(tier as any)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className={`font-semibold ${selectedTier === tier ? info.textColor : 'text-gray-900 dark:text-white'}`}>
                                            {info.name}
                                        </h4>
                                        <div className={`w-4 h-4 rounded-full border-2 ${
                                            selectedTier === tier 
                                                ? 'bg-current border-current' 
                                                : 'border-gray-300 dark:border-gray-600'
                                        }`} />
                                    </div>
                                    <p className={`text-sm ${selectedTier === tier ? info.textColor : 'text-gray-600 dark:text-gray-400'}`}>
                                        {info.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Max Symbols to Optimize
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={maxSymbols}
                                onChange={(e) => setMaxSymbols(parseInt(e.target.value) || 5)}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg"
                                disabled={isOptimizing}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Target Profit % (Optional)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={targetProfit}
                                onChange={(e) => setTargetProfit(parseInt(e.target.value) || 15)}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg"
                                disabled={isOptimizing}
                            />
                        </div>
                    </div>

                    {/* Current Settings */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Current Settings</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">Market:</span>
                                <div className="font-medium text-gray-900 dark:text-white">{currentMarketType} - {currentMarket}</div>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">Wallet:</span>
                                <div className="font-medium text-gray-900 dark:text-white">${parseInt(currentWalletAmount || '10000').toLocaleString()}</div>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">Indicators:</span>
                                <div className="font-medium text-gray-900 dark:text-white">{currentIndicators.length} selected</div>
                            </div>
                            <div>
                                <span className="text-gray-600 dark:text-gray-400">Optimization:</span>
                                <div className="font-medium text-gray-900 dark:text-white">{tierDescriptions[selectedTier].name}</div>
                            </div>
                        </div>
                    </div>

                    {/* Recommendations */}
                    {recommendations && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                            <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-3">💡 AI Recommendations for {currentMarketType}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-blue-700 dark:text-blue-300 font-medium">Top Symbols:</span>
                                    <div className="text-blue-800 dark:text-blue-200">
                                        {recommendations.recommendedSymbols.slice(0, 3).map(s => s.symbol).join(', ')}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-blue-700 dark:text-blue-300 font-medium">Best Indicators:</span>
                                    <div className="text-blue-800 dark:text-blue-200">
                                        {recommendations.recommendedIndicators.slice(0, 3).join(', ')}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-blue-700 dark:text-blue-300 font-medium">Optimal Timeframes:</span>
                                    <div className="text-blue-800 dark:text-blue-200">
                                        {recommendations.recommendedTimeframes.join(', ')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Progress */}
                    {isOptimizing && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <Spinner className="text-indigo-600" />
                                <span className="font-medium text-indigo-900 dark:text-indigo-200">
                                    Optimizing...
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                                <div 
                                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-sm text-indigo-700 dark:text-indigo-300">{status}</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isOptimizing}
                        className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleOptimize}
                        disabled={isOptimizing}
                        className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isOptimizing ? (
                            <>
                                <Spinner className="text-white" />
                                Optimizing...
                            </>
                        ) : (
                            <>
                                <span>⚡</span>
                                Start ProfitMax
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
