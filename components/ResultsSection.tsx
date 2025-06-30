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
                        <img src="https://cdn.hugeicons.com/icons/analytics-02-stroke-rounded.svg" className="w-8 h-8 text-gray-400 dark:text-gray-500" alt="Analytics" />
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
        <section className="glass-effect analysis-results-mobile sm:p-8 rounded-2xl shadow-2xl border-border backdrop-blur-xl card-glow sharp-corners relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/10 dark:to-transparent"></div>
            <div className="relative z-10 analysis-nested-mobile">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <img src="https://cdn.hugeicons.com/icons/analytics-up-stroke-rounded.svg" className="w-8 h-8 text-green-600 dark:text-green-400" alt="Analytics" />
                        Analysis Results
                    </h2>

                    {/* Save Analysis Button */}
                    {user && hasAnalyses && currentInputs && !savedAnalysisId && (
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
                                    <img src="https://cdn.hugeicons.com/icons/cloud-upload-stroke-rounded.svg" className="w-4 h-4 filter brightness-0 invert" alt="Save" />
                                    <span>Save Analysis</span>
                                </>
                            )}
                        </button>
                    )}

                    {!user && hasAnalyses && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 rounded-lg">
                            <img src="https://cdn.hugeicons.com/icons/login-03-stroke-rounded.svg" className="w-4 h-4 text-amber-600 dark:text-amber-400" alt="Login" />
                            <span>Sign in to save analysis</span>
                        </div>
                    )}

                    {savedAnalysisId && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 rounded-lg">
                            <img src="https://cdn.hugeicons.com/icons/tick-02-stroke-rounded.svg" className="w-4 h-4 text-green-600 dark:text-green-400" alt="Saved" />
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