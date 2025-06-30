Addressing date formatting, text colors, and analysis count update.
```

```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';

interface AnalysisHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadAnalysis: (analysis: any) => void;
}

export const AnalysisHistoryModal: React.FC<AnalysisHistoryModalProps> = ({
  isOpen,
  onClose,
  onLoadAnalysis
}) => {
  const { loadAnalysisHistory, deleteAnalysis } = useAuth();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const history = await loadAnalysisHistory();
      setAnalyses(history);
    } catch (error: any) {
      setError(error.message || 'Failed to load analysis history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!confirm('Are you sure you want to delete this analysis?')) return;

    try {
      await deleteAnalysis(analysisId);
      setAnalyses(prev => prev.filter(a => a.id !== analysisId));
    } catch (error: any) {
      setError(error.message || 'Failed to delete analysis');
    }
  };

  const handleLoadAnalysis = (analysis: any) => {
    onLoadAnalysis(analysis);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Analysis History
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading history...</span>
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400">No saved analyses found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Your analysis results will appear here when you save them
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => {
                // Get analysis summary
                const getAnalysisSummary = (analysis: any) => {
                  const results = analysis.results || [];
                  const totalResults = results.length;
                  const successfulResults = results.filter((r: any) => r.analysisResult).length;
                  const buyRecommendations = results.filter((r: any) => 
                    r.analysisResult?.recommendation?.toLowerCase().includes('buy')
                  ).length;
                  const sellRecommendations = results.filter((r: any) => 
                    r.analysisResult?.recommendation?.toLowerCase().includes('sell')
                  ).length;

                  return {
                    totalResults,
                    successfulResults,
                    buyRecommendations,
                    sellRecommendations,
                    avgConfidence: results.reduce((acc: number, r: any) => 
                      acc + (r.analysisResult?.confidence || 0), 0) / Math.max(successfulResults, 1)
                  };
                };

                const summary = getAnalysisSummary(analysis);

                return (
                  <div
                    key={analysis.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Basic Info */}
                        <div className="mb-3">
                          <div className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {analysis.symbols.join(', ')} Analysis
                            <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                              {analysis.symbols.length} symbol{analysis.symbols.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Date:</strong> {analysis.timestamp ? 
                              (analysis.timestamp.seconds ? 
                                new Date(analysis.timestamp.seconds * 1000).toLocaleDateString() : 
                                new Date(analysis.timestamp).toLocaleDateString()
                              ) : 'Invalid Date'
                            }
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Timeframe:</strong> {analysis.settings?.selectedTimeframe || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Market:</strong> {analysis.settings?.selectedMarketType || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Wallet:</strong> ${analysis.settings?.walletAmount || 'N/A'}
                          </div>
                        </div>

                        {/* Analysis Summary */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Results:</span>
                              <span className="ml-1 font-medium">{summary.successfulResults}/{summary.totalResults}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Avg Confidence:</span>
                              <span className="ml-1 font-medium">{summary.avgConfidence.toFixed(0)}%</span>
                            </div>
                            <div>
                              <span className="text-green-600 dark:text-green-400">Buy:</span>
                              <span className="ml-1 font-medium">{summary.buyRecommendations}</span>
                            </div>
                            <div>
                              <span className="text-red-600 dark:text-red-400">Sell:</span>
                              <span className="ml-1 font-medium">{summary.sellRecommendations}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-2">
                          {(analysis.settings?.selectedIndicators || []).map((indicator: string) => (
                            <span
                              key={indicator}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                            >
                              {indicator}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleLoadAnalysis(analysis)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          title="Load this analysis into the main app"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteAnalysis(analysis.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          title="Delete this analysis"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```Addressing date formatting, text colors, and analysis count update.
`