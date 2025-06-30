import React, { useState } from "react";
import { AssetResultCard } from "./AssetResultCard.tsx";
import { useAuth } from "../contexts/AuthContext.tsx";
import type { AssetAnalysis } from "../types.ts";

interface ResultsSectionProps {
    analyses: AssetAnalysis[];
    theme: "light" | "dark";
    isLoading: boolean;
    currentInputs?: any;
}

export const ResultsSection: React.FC<ResultsSectionProps> = ({
    analyses,
    theme,
    isLoading,
    currentInputs,
}) => {
    const { user, saveAnalysis } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);

    const handleSaveAnalysis = async () => {
        if (!user || !currentInputs) return;

        try {
            setIsSaving(true);

            // Prepare analysis results for saving
            const analysisResults = analyses.map(analysis => ({
                symbol: analysis.symbol,
                historicalData: analysis.historicalData,
                analysisResult: analysis.analysisResult,
                patternDetails: analysis.patternDetails,
                error: analysis.error,
                isLoading: false
            }));

            const analysisId = await saveAnalysis(analysisResults, currentInputs);
            setSavedAnalysisId(analysisId);

            // Show success message
            console.log('Analysis saved successfully with ID:', analysisId);
        } catch (error: any) {
            console.error('Failed to save analysis:', error);
            alert(error.message || 'Failed to save analysis');
        } finally {
            setIsSaving(false);
        }
    };

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
        <section className="glass-effect p-6 sm:p-8 rounded-2xl shadow-2xl border-border backdrop-blur-xl card-glow sharp-corners relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/10 dark:to-transparent"></div>
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <span className="material-symbols-outlined text-3xl text-green-600 dark:text-green-400">
                            trending_up
                        </span>
                        Analysis Results
                    </h2>

                    {/* Save Analysis Button */}
                    {user && !savedAnalysisId && (
                        <button
                            onClick={handleSaveAnalysis}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span>Save Analysis</span>
                                </>
                            )}
                        </button>
                    )}

                    {savedAnalysisId && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Analysis Saved</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {analyses.map((analysis, index) => (
                        <AssetResultCard
                            key={`${analysis.symbol.symbol}-${index}`}
                            analysis={analysis}
                            theme={theme}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};