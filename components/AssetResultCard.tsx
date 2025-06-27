import React from 'react';
import type { AssetAnalysis } from '../types.ts';
import { PositionResult } from './PositionResult.tsx';
import { PriceChart } from './PriceChart.tsx';
import { NewsSection } from './NewsSection.tsx';
import { Spinner } from './Spinner.tsx';
import { ErrorMessage } from './ErrorMessage.tsx';

interface AssetResultCardProps {
    analysis: AssetAnalysis;
    theme: 'light' | 'dark';
}

export const AssetResultCard: React.FC<AssetResultCardProps> = ({ analysis, theme }) => {
    const { symbol, isLoading, error, analysisResult, historicalData } = analysis;

    const renderContent = () => {
        if (isLoading) {
            return (
                 <div className="flex flex-col items-center justify-center gap-4 p-8 text-gray-600 dark:text-gray-400 min-h-[300px]">
                    <Spinner className="h-8 w-8 text-indigo-500" />
                    <p className="text-lg font-medium animate-pulse">Analyzing {symbol}...</p>
                </div>
            );
        }
        if (error) return <ErrorMessage message={error} />;
        if (analysisResult) {
            return (
                <div className="flex flex-col gap-6">
                    <PositionResult result={analysisResult} />
                    {historicalData.length > 0 && <PriceChart data={historicalData} theme={theme} />}
                    <NewsSection news={analysisResult.news} />
                </div>
            );
        }
        return <ErrorMessage message="Analysis could not be completed for this asset." />;
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-3">{symbol} Analysis</h2>
            {renderContent()}
        </div>
    );
};