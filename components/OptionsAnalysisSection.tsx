
import React from 'react';
import type { OptionsAnalysis } from '../types.ts';

interface OptionsAnalysisSectionProps {
    optionsAnalysis: OptionsAnalysis;
}

export const OptionsAnalysisSection: React.FC<OptionsAnalysisSectionProps> = ({ optionsAnalysis }) => {
    return (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
            <h4 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Options Analysis
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {optionsAnalysis.callRecommendation && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                        <h5 className="font-medium text-green-800 dark:text-green-300 mb-2">Call Option</h5>
                        <div className="text-sm text-green-700 dark:text-green-400 space-y-1">
                            <p><span className="font-medium">Strike:</span> ${optionsAnalysis.callRecommendation.strike.toFixed(2)}</p>
                            <p><span className="font-medium">Expiration:</span> {optionsAnalysis.callRecommendation.expiration}</p>
                            <p><span className="font-medium">Premium:</span> ${optionsAnalysis.callRecommendation.premium.toFixed(2)}</p>
                            <div className="grid grid-cols-3 gap-2 mt-2 p-2 bg-green-100 dark:bg-green-800/30 rounded">
                                <div className="text-center">
                                    <p className="text-xs font-medium">Bid</p>
                                    <p className="font-bold">${optionsAnalysis.callRecommendation.bid?.toFixed(2) || 'N/A'}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-medium">Ask</p>
                                    <p className="font-bold">${optionsAnalysis.callRecommendation.ask?.toFixed(2) || 'N/A'}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-medium">Spread</p>
                                    <p className="font-bold">${optionsAnalysis.callRecommendation.spread?.toFixed(2) || 'N/A'}</p>
                                </div>
                            </div>
                            <p className="mt-2"><span className="font-medium">Reasoning:</span> {optionsAnalysis.callRecommendation.reasoning}</p>
                        </div>
                    </div>
                )}
                
                {optionsAnalysis.putRecommendation && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                        <h5 className="font-medium text-red-800 dark:text-red-300 mb-2">Put Option</h5>
                        <div className="text-sm text-red-700 dark:text-red-400 space-y-1">
                            <p><span className="font-medium">Strike:</span> ${optionsAnalysis.putRecommendation.strike.toFixed(2)}</p>
                            <p><span className="font-medium">Expiration:</span> {optionsAnalysis.putRecommendation.expiration}</p>
                            <p><span className="font-medium">Premium:</span> ${optionsAnalysis.putRecommendation.premium.toFixed(2)}</p>
                            <div className="grid grid-cols-3 gap-2 mt-2 p-2 bg-red-100 dark:bg-red-800/30 rounded">
                                <div className="text-center">
                                    <p className="text-xs font-medium">Bid</p>
                                    <p className="font-bold">${optionsAnalysis.putRecommendation.bid?.toFixed(2) || 'N/A'}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-medium">Ask</p>
                                    <p className="font-bold">${optionsAnalysis.putRecommendation.ask?.toFixed(2) || 'N/A'}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-medium">Spread</p>
                                    <p className="font-bold">${optionsAnalysis.putRecommendation.spread?.toFixed(2) || 'N/A'}</p>
                                </div>
                            </div>
                            <p className="mt-2"><span className="font-medium">Reasoning:</span> {optionsAnalysis.putRecommendation.reasoning}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
