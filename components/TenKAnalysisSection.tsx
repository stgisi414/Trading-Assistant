
import React from 'react';
import type { TenKAnalysis } from '../services/tenKAnalysisService.ts';

interface TenKAnalysisSectionProps {
    tenKAnalysis: TenKAnalysis | null | undefined;
}

export const TenKAnalysisSection: React.FC<TenKAnalysisSectionProps> = ({ tenKAnalysis }) => {
    if (!tenKAnalysis) {
        return null;
    }

    const getRecommendationColor = (recommendation: string) => {
        if (recommendation.includes('Strong BUY') || recommendation.includes('BUY')) {
            return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700';
        } else if (recommendation.includes('HOLD')) {
            return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700';
        } else {
            return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700';
        }
    };

    return (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                10-K Fundamental Analysis ({tenKAnalysis.reportYear})
            </h4>

            <div className="space-y-4">
                {/* Investment Recommendation */}
                <div className={`p-3 rounded-lg border ${getRecommendationColor(tenKAnalysis.investmentRecommendation)}`}>
                    <h5 className="font-semibold mb-2">Investment Recommendation</h5>
                    <p className="text-sm">{tenKAnalysis.investmentRecommendation}</p>
                </div>

                {/* Financial Highlights */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600 dark:text-gray-400">Revenue</div>
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                            ${(tenKAnalysis.financialHighlights.revenue / 1000000).toFixed(1)}M
                        </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600 dark:text-gray-400">Net Income</div>
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                            ${(tenKAnalysis.financialHighlights.netIncome / 1000000).toFixed(1)}M
                        </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600 dark:text-gray-400">EPS</div>
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                            ${tenKAnalysis.financialHighlights.eps.toFixed(2)}
                        </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600 dark:text-gray-400">ROE</div>
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                            {(tenKAnalysis.financialHighlights.roe * 100).toFixed(1)}%
                        </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600 dark:text-gray-400">Debt/Equity</div>
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                            {tenKAnalysis.financialHighlights.debtToEquity.toFixed(2)}
                        </div>
                    </div>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-xs text-gray-600 dark:text-gray-400">Profit Margin</div>
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                            {(tenKAnalysis.keyMetrics.profitMargin * 100).toFixed(1)}%
                        </div>
                    </div>
                </div>

                {/* Business Overview */}
                <div>
                    <h5 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Business Overview</h5>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{tenKAnalysis.businessOverview}</p>
                </div>

                {/* Risk Factors */}
                <div>
                    <h5 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Key Risk Factors</h5>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        {tenKAnalysis.riskFactors.map((risk, index) => (
                            <li key={index} className="flex items-start">
                                <span className="text-red-500 mr-2">•</span>
                                {risk}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Competitive Position & Growth Strategy */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h5 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Competitive Position</h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{tenKAnalysis.competitivePosition}</p>
                    </div>
                    <div>
                        <h5 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Growth Strategy</h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{tenKAnalysis.growthStrategy}</p>
                    </div>
                </div>

                {/* Analysis Date */}
                <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-blue-200 dark:border-blue-700">
                    Analysis generated on {new Date(tenKAnalysis.analysisDate).toLocaleDateString()}
                </div>
            </div>
        </div>
    );
};
