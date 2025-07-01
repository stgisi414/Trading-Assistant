
import React from 'react';
import type { TenKAnalysis } from '../types.ts';

interface TenKAnalysisSectionProps {
    analysis: TenKAnalysis;
}

export const TenKAnalysisSection: React.FC<TenKAnalysisSectionProps> = ({ analysis }) => {
    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 80) return 'text-green-600 dark:text-green-400';
        if (confidence >= 60) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getConfidenceBg = (confidence: number) => {
        if (confidence >= 80) return 'bg-green-100 dark:bg-green-900/20';
        if (confidence >= 60) return 'bg-yellow-100 dark:bg-yellow-900/20';
        return 'bg-red-100 dark:bg-red-900/20';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    📊 10-K Financial Report Analysis
                </h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceBg(analysis.analysisConfidence)} ${getConfidenceColor(analysis.analysisConfidence)}`}>
                    {analysis.analysisConfidence}% Confidence
                </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Report Filed: {new Date(analysis.reportDate).toLocaleDateString()}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Key Findings */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                        🔍 Key Findings
                    </h4>
                    <ul className="space-y-2">
                        {analysis.keyFindings.map((finding, index) => (
                            <li key={index} className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{finding}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Risk Factors */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 dark:text-red-200 mb-3 flex items-center gap-2">
                        ⚠️ Risk Factors
                    </h4>
                    <ul className="space-y-2">
                        {analysis.riskFactors.map((risk, index) => (
                            <li key={index} className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span>
                                <span>{risk}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Business Overview */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                        🏢 Business Overview
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {analysis.businessOverview}
                    </p>
                </div>

                {/* Financial Highlights */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
                        💰 Financial Highlights
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
                        {analysis.financialHighlights}
                    </p>
                </div>

                {/* Management Discussion */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
                        👥 Management Discussion
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300 leading-relaxed">
                        {analysis.managementDiscussion}
                    </p>
                </div>

                {/* Competitive Position */}
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-3 flex items-center gap-2">
                        🎯 Competitive Position
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed">
                        {analysis.competitivePosition}
                    </p>
                </div>

                {/* Future Outlook */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 lg:col-span-2">
                    <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-3 flex items-center gap-2">
                        🔮 Future Outlook
                    </h4>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
                        {analysis.futureOutlook}
                    </p>
                </div>

                {/* Investment Implications */}
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg p-4 lg:col-span-2 border-l-4 border-yellow-400">
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3 flex items-center gap-2">
                        💡 Investment Implications
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed font-medium">
                        {analysis.investmentImplications}
                    </p>
                </div>
            </div>
        </div>
    );
};
