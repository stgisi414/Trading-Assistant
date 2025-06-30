import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PatternDetails } from '../types.ts';

interface PatternAnalysisSectionProps {
    patterns: PatternDetails[];
    theme: 'light' | 'dark';
}

export const PatternAnalysisSection: React.FC<PatternAnalysisSectionProps> = ({ patterns, theme }) => {
    if (!patterns || patterns.length === 0) {
        return null;
    }

    const getPatternColor = (patternType: string) => {
        switch (patternType) {
            case 'HeadAndShouldersTop':
            case 'DoubleTop':
                return 'text-red-600 dark:text-red-400';
            case 'HeadAndShouldersBottom':
            case 'DoubleBottom':
                return 'text-green-600 dark:text-green-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    };

    const getReliabilityBadgeColor = (reliability: string) => {
        switch (reliability) {
            case 'High':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'Medium':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'Low':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getPatternIcon = (patternType: string) => {
        switch (patternType) {
            case 'HeadAndShouldersTop':
                return '📉';
            case 'HeadAndShouldersBottom':
                return '📈';
            case 'DoubleTop':
                return '🔴';
            case 'DoubleBottom':
                return '🟢';
            default:
                return '📊';
        }
    };

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span>📊</span>
                Chart Pattern Analysis
            </h3>

            <div className="space-y-4">
                {patterns.map((pattern, index) => (
                    <div
                        key={index}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{getPatternIcon(pattern.patternType)}</span>
                                <div>
                                    <h4 className={`text-lg font-semibold ${getPatternColor(pattern.patternType)}`}>
                                        {pattern.patternType.replace(/([A-Z])/g, ' $1').trim()}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReliabilityBadgeColor(pattern.reliability)}`}>
                                            {pattern.reliability} Reliability
                                        </span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Confidence: {pattern.confidence}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Description</h5>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({children}) => <p className="mb-2">{children}</p>,
                                            ul: ({children}) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                                            ol: ({children}) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                                            li: ({children}) => <li>{children}</li>,
                                            strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                                            code: ({children}) => <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">{children}</code>,
                                        }}
                                    >
                                        {pattern.description}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            <div>
                                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Trading Implications</h5>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 prose prose-sm dark:prose-invert max-w-none">
                                    <strong>Trading Implications:</strong>
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({children}) => <p className="mb-2 inline ml-1">{children}</p>,
                                            ul: ({children}) => <ul className="list-disc list-inside mb-2 ml-1">{children}</ul>,
                                            ol: ({children}) => <ol className="list-decimal list-inside mb-2 ml-1">{children}</ol>,
                                            li: ({children}) => <li>{children}</li>,
                                            strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                                            code: ({children}) => <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">{children}</code>,
                                        }}
                                    >
                                        {pattern.tradingImplications}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>

                        {Object.keys(pattern.keyLevels).length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <h5 className="font-medium text-gray-900 dark:text-white mb-3">Key Levels</h5>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {pattern.keyLevels.neckline && (
                                        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                                            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Neckline</div>
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                ${pattern.keyLevels.neckline.toFixed(2)}
                                            </div>
                                        </div>
                                    )}
                                    {pattern.keyLevels.support && (
                                        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                            <div className="text-xs text-green-600 dark:text-green-400 font-medium">Support</div>
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                ${pattern.keyLevels.support.toFixed(2)}
                                            </div>
                                        </div>
                                    )}
                                    {pattern.keyLevels.resistance && (
                                        <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                            <div className="text-xs text-red-600 dark:text-red-400 font-medium">Resistance</div>
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                ${pattern.keyLevels.resistance.toFixed(2)}
                                            </div>
                                        </div>
                                    )}
                                    {pattern.keyLevels.targetPrice && (
                                        <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                                            <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Target</div>
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                ${pattern.keyLevels.targetPrice.toFixed(2)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                            Timeframe: {pattern.timeframe}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Pattern Analysis Explanations</h4>
                <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <div>
                        <strong>Head and Shoulders Top:</strong> A bearish reversal pattern with three peaks - the middle peak (head) higher than the other two (shoulders). Indicates potential downward trend.
                    </div>
                    <div>
                        <strong>Head and Shoulders Bottom (Inverse):</strong> A bullish reversal pattern with three troughs - the middle trough (head) lower than the other two (shoulders). Indicates potential upward trend.
                    </div>
                    <div>
                        <strong>Double Top:</strong> A bearish reversal pattern with two peaks at approximately the same level, indicating resistance and potential downward movement.
                    </div>
                    <div>
                        <strong>Double Bottom:</strong> A bullish reversal pattern with two troughs at approximately the same level, indicating support and potential upward movement.
                    </div>
                </div>
            </div>
        </div>
    );
};