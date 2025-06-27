
import React from 'react';
import type { OpenInterestAnalysis } from '../types.ts';

interface OpenInterestSectionProps {
    openInterestAnalysis: OpenInterestAnalysis;
}

export const OpenInterestSection: React.FC<OpenInterestSectionProps> = ({ openInterestAnalysis }) => {
    const getTrendColor = (trend: string) => {
        switch (trend) {
            case 'INCREASING': return 'text-green-600 dark:text-green-400';
            case 'DECREASING': return 'text-red-600 dark:text-red-400';
            default: return 'text-yellow-600 dark:text-yellow-400';
        }
    };

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'BULLISH': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700';
            case 'BEARISH': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
            default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700';
        }
    };

    const getSpeculativeLevel = (ratio: number) => {
        if (ratio > 3) return { level: 'High', color: 'text-red-600 dark:text-red-400' };
        if (ratio > 1.5) return { level: 'Medium', color: 'text-yellow-600 dark:text-yellow-400' };
        return { level: 'Low', color: 'text-green-600 dark:text-green-400' };
    };

    const speculativeLevel = getSpeculativeLevel(openInterestAnalysis.speculativeRatio);

    return (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Open Interest Analysis
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Current OI</h5>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                        {openInterestAnalysis.currentOpenInterest.toLocaleString()}
                    </p>
                </div>
                
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Trend</h5>
                    <p className={`text-lg font-bold ${getTrendColor(openInterestAnalysis.openInterestTrend)}`}>
                        {openInterestAnalysis.openInterestTrend}
                    </p>
                </div>
                
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                    <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Speculative Activity</h5>
                    <p className={`text-lg font-bold ${speculativeLevel.color}`}>
                        {speculativeLevel.level}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        Ratio: {openInterestAnalysis.speculativeRatio.toFixed(2)}
                    </p>
                </div>
                
                <div className={`p-3 rounded-lg border ${getSentimentColor(openInterestAnalysis.marketSentiment)}`}>
                    <h5 className="font-medium mb-1">Market Sentiment</h5>
                    <p className="text-lg font-bold">
                        {openInterestAnalysis.marketSentiment}
                    </p>
                </div>
            </div>
            
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700">
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Analysis</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {openInterestAnalysis.analysis}
                </p>
            </div>
        </div>
    );
};
