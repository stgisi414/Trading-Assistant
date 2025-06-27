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

// Placeholder components for OptionsAnalysisSection and OrderAnalysisSection
const OptionsAnalysisSection = ({ optionsAnalysis }: any) => {
    return (
        <div>
            <h3>Options Analysis</h3>
            <p>{JSON.stringify(optionsAnalysis)}</p>
        </div>
    );
};

const OrderAnalysisSection = ({ orderAnalysis }: any) => {
    return (
        <div>
            <h3>Order Analysis</h3>
            <p>{JSON.stringify(orderAnalysis)}</p>
        </div>
    );
};

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
                    <PriceChart data={historicalData} theme={theme} />
                    {analysisResult.optionsAnalysis && (
                        <OptionsAnalysisSection optionsAnalysis={analysisResult.optionsAnalysis} />
                    )}
                    {analysisResult.orderAnalysis && (
                        <OrderAnalysisSection orderAnalysis={analysisResult.orderAnalysis} />
                    )}
                    <NewsSection news={analysisResult.news} />
                </div>
            );
        }
        return <ErrorMessage message="Analysis could not be completed for this asset." />;
    };

    return (
        <div className="glass-effect rounded-2xl shadow-2xl overflow-hidden card-glow sharp-corners relative border backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-blue-500/5 dark:from-white/10 dark:via-transparent dark:to-blue-500/10"></div>
            <div className="relative z-10">
                <div className="p-6 border-b border-white/20 dark:border-white/10 bg-gradient-to-r from-transparent via-white/5 to-transparent dark:via-white/10">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 dark:from-gray-200 dark:to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-amber-500 rounded-full animate-pulse"></div>
                        {symbol}
                    </h2>
                </div>
                <div className="p-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};