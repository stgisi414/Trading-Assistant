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
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <p className="text-gray-500 dark:text-gray-400">Enter asset details above and click "Analyze" to see results.</p>
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
                    <AssetResultCard key={analysis.symbol} analysis={analysis} theme={theme} />
                ))}
            </div>
        </section>
    );
};