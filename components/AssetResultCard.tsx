import React from 'react';
import type { AssetAnalysis } from '../types.ts';
import PositionResult from './PositionResult.tsx';
import { PriceChart } from './PriceChart.tsx';
import { NewsSection } from './NewsSection.tsx';
import { Spinner } from './Spinner.tsx';
import { ErrorMessage } from './ErrorMessage.tsx';
import { PatternAnalysisSection } from './PatternAnalysisSection';
import { OptionsAnalysisSection } from './OptionsAnalysisSection.tsx';
import { OrderAnalysisSection } from './OrderAnalysisSection.tsx';
import { OpenInterestSection } from './OpenInterestSection.tsx';

interface AssetResultCardProps {
    analysis: AssetAnalysis;
    theme: 'light' | 'dark';
}

// Placeholder components for OptionsAnalysisSection and OrderAnalysisSection


export const AssetResultCard: React.FC<AssetResultCardProps> = ({ analysis, theme }) => {
    const { symbol, isLoading, error, analysisResult, historicalData } = analysis;

    const renderContent = () => {
        if (isLoading) {
            return (
                 <div className="flex flex-col items-center justify-center gap-4 p-8 text-gray-600 dark:text-gray-400 min-h-[300px]">
                    <Spinner className="h-8 w-8 text-indigo-500" />
                    <p className="text-lg font-medium animate-pulse">Analyzing {symbol.symbol}...</p>
                </div>
            );
        }
        if (error) return <ErrorMessage message={error} />;
        if (analysisResult) {
            return (
                <div className="flex flex-col gap-6">
                    {/* Analysis Results - includes logos and illustrations */}
                    {analysis.analysisResult && (
                        <PositionResult result={analysis.analysisResult} theme={theme} />
                    )}
                    <PriceChart data={historicalData} theme={theme} />
                    {analysisResult.optionsAnalysis && (
                        <OptionsAnalysisSection optionsAnalysis={analysisResult.optionsAnalysis} />
                    )}
                    {analysisResult.orderAnalysis && (
                        <OrderAnalysisSection orderAnalysis={analysisResult.orderAnalysis} />
                    )}


                    {analysis.patternDetails && analysis.patternDetails.length > 0 && (
                        <PatternAnalysisSection patterns={analysis.patternDetails} theme={theme} />
                    )}
                    {analysisResult.openInterestAnalysis && (
                        <OpenInterestSection openInterestAnalysis={analysisResult.openInterestAnalysis} />
                    )}
                </div>
            );
        }
        return <ErrorMessage message="Analysis could not be completed for this asset." />;
    };

    return (
        <div className="glass-effect analysis-results-mobile sm:p-6 md:p-8 rounded-xl sm:rounded-2xl shadow-2xl border-border backdrop-blur-xl card-glow sharp-corners relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-blue-500/5 dark:from-white/10 dark:via-transparent dark:to-blue-500/10"></div>
            <div className="relative z-10 space-y-4 sm:space-y-6 md:space-y-8 analysis-nested-mobile sm:p-0">
                <div className="analysis-nested-mobile py-6 border-b border-white/20 dark:border-white/10 bg-gradient-to-r from-transparent via-white/5 to-transparent dark:via-white/10">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 dark:from-gray-200 dark:to-blue-400 bg-clip-text text-transparent flex items-center justify-center gap-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-amber-500 rounded-full animate-pulse"></div>
                        {symbol.symbol}
                    </h2>
                </div>
                <div className="analysis-nested-mobile py-6">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};