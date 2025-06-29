import React from 'react';
import type { AssetAnalysis } from '../types.ts';
import { AssetResultCard } from './AssetResultCard.tsx';

interface ResultsSectionProps {
    analyses: AssetAnalysis[];
    theme: 'light' | 'dark';
    isLoading: boolean;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({ analyses, theme, isLoading }) => {
    const hasAnalyses = analyses.length > 0;
    
    if (!isLoading && !hasAnalyses) {
        return (
            <div className="text-center p-12 glass-effect rounded-2xl shadow-2xl card-glow sharp-corners relative overflow-hidden border backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/10 dark:to-transparent"></div>
                <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-400/20 to-gray-600/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">Enter asset details above and click "Analyze" to see results.</p>
                </div>
            </div>
        );
    }
    
    if (!hasAnalyses) {
        return null;
    }

    return (
        <section className="flex flex-col gap-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {analyses.map((analysis) => (
                    <AssetResultCard key={analysis.symbol.symbol} analysis={analysis} theme={theme} />
                ))}
            </div>
        </section>
    );
};