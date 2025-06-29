
import React, { useState } from 'react';
import type { AnalysisResult } from '../types.ts';
import { Position } from '../types.ts';
import { NewsSection } from './NewsSection.tsx';
import { ImageGallery } from './ImageGallery.tsx';

interface PositionResultProps {
    result: AnalysisResult;
    theme: 'light' | 'dark';
}

export const PositionResult: React.FC<PositionResultProps> = ({ result, theme }) => {
    const [showFullReasoning, setShowFullReasoning] = useState(false);
    
    const getPositionColor = (position: Position) => {
        switch (position) {
            case Position.LONG:
                return 'text-green-600 dark:text-green-400';
            case Position.SHORT:
                return 'text-red-600 dark:text-red-400';
            case Position.HOLD:
                return 'text-yellow-600 dark:text-yellow-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    };

    const getPositionIcon = (position: Position) => {
        switch (position) {
            case Position.LONG:
                return '📈';
            case Position.SHORT:
                return '📉';
            case Position.HOLD:
                return '⏸️';
            default:
                return '❓';
        }
    };

    const truncateText = (text: string, maxLength: number = 200) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            {/* Header with Symbol and Position */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                    {result.symbol}
                </h3>
                <div className={`text-lg font-semibold ${getPositionColor(result.position)}`}>
                    {getPositionIcon(result.position)} {result.position}
                </div>
            </div>

            {/* Symbol Logo */}
            {result.symbolLogo && result.symbolLogo.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Company Logo
                    </h4>
                    <ImageGallery 
                        images={result.symbolLogo} 
                        title="Company Logo" 
                        theme={theme}
                    />
                </div>
            )}

            {/* Confidence Score */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Confidence Score
                    </span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        {result.confidence}%
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${result.confidence}%` }}
                    ></div>
                </div>
            </div>

            {/* Reasoning */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Analysis Reasoning
                    </h4>
                    {result.reasoning && result.reasoning.length > 200 && (
                        <button
                            onClick={() => setShowFullReasoning(!showFullReasoning)}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                        >
                            {showFullReasoning ? 'Show Less' : 'Show More'}
                        </button>
                    )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {showFullReasoning ? result.reasoning : truncateText(result.reasoning || '')}
                </p>
            </div>

            {/* Reasoning Illustrations */}
            {result.reasoningIllustrations && result.reasoningIllustrations.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Analysis Illustrations
                    </h4>
                    <ImageGallery 
                        images={result.reasoningIllustrations} 
                        title="Analysis Illustrations" 
                        theme={theme}
                    />
                </div>
            )}

            {/* Entry and Exit Points */}
            {(result.entryPoint || result.exitPoint) && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {result.entryPoint && (
                        <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Entry Point
                            </span>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                ${result.entryPoint.toFixed(2)}
                            </p>
                        </div>
                    )}
                    {result.exitPoint && (
                        <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Exit Point
                            </span>
                            <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                ${result.exitPoint.toFixed(2)}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* News Section */}
            {result.news && result.news.length > 0 && (
                <div className="mb-4">
                    <NewsSection news={result.news} theme={theme} />
                </div>
            )}

            {/* No News Message */}
            {(!result.news || result.news.length === 0) && (
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                        No news articles found for this analysis. This could indicate API configuration issues.
                    </p>
                </div>
            )}
        </div>
    );
};
