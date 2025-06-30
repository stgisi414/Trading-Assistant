
import React, { useState, useEffect } from 'react';
import { proFlowService, type ProFlowMode } from '../services/proFlowService.ts';

interface ProFlowControlsProps {
    onShowToast: (toast: any) => void;
    appCallbacks: {
        setSelectedSymbols?: (symbols: any[]) => void;
        setWalletAmount?: (amount: string) => void;
        setSelectedIndicators?: (indicators: string[]) => void;
        setSelectedTimeframe?: (timeframe: string) => void;
        setSelectedMarketType?: (marketType: string) => void;
        setSelectedMarket?: (market: string) => void;
        handleAnalyze?: () => void;
    };
}

export const ProFlowControls: React.FC<ProFlowControlsProps> = ({ onShowToast, appCallbacks }) => {
    const [status, setStatus] = useState(proFlowService.getStatus());
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedMode, setSelectedMode] = useState<ProFlowMode>('auto');
    const [flowPrompt, setFlowPrompt] = useState('');
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

    useEffect(() => {
        // Set up ProFlow service callbacks
        proFlowService.setToastCallback(onShowToast);
        proFlowService.setAppCallbacks(appCallbacks);

        // Update status periodically
        const interval = setInterval(() => {
            setStatus(proFlowService.getStatus());
        }, 500);

        return () => clearInterval(interval);
    }, [onShowToast, appCallbacks]);

    const handleStartProFlow = () => {
        proFlowService.startProFlow();
    };

    const handleStopProFlow = () => {
        proFlowService.stopProFlow();
    };

    const handleQuickDemo = () => {
        proFlowService.runQuickDemo();
    };

    const handleAdvancedAnalysis = () => {
        proFlowService.runAdvancedAnalysis();
    };

    const handleModeChange = (mode: ProFlowMode) => {
        setSelectedMode(mode);
        proFlowService.setMode(mode);
    };

    const handleContinue = () => {
        proFlowService.continueFromManualPause();
    };

    const handleFlowPromptChange = (value: string) => {
        setFlowPrompt(value);
        proFlowService.setFlowPrompt(value);
    };

    const handleFlowPromptBlur = () => {
        if (flowPrompt.trim()) {
            proFlowService.confirmFlowPrompt(flowPrompt);
        }
    };

    const handleImprovePrompt = async () => {
        setIsGeneratingPrompt(true);
        try {
            const improvedPrompt = await proFlowService.improveFlowPrompt(flowPrompt);
            setFlowPrompt(improvedPrompt);
            proFlowService.setFlowPrompt(improvedPrompt);
        } catch (error) {
            console.error('Error improving prompt:', error);
            onShowToast({
                id: Date.now().toString(),
                message: '❌ Error improving prompt. Please try again.',
                type: 'error'
            });
        } finally {
            setIsGeneratingPrompt(false);
        }
    };

    return (
        <div className="glass-effect p-4 rounded-xl border border-purple-200 dark:border-purple-700 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 dark:from-purple-900/20 dark:to-indigo-900/20">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${status.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                        <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
                            Signatex ProFlow
                        </h3>
                    </div>
                    {status.isRunning && (
                        <div className="flex gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                status.isPaused 
                                    ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
                                    : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                            }`}>
                                {status.isPaused ? 'Paused' : 'Running'} {status.currentStep + 1}/{status.totalSteps}
                            </span>
                            <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                                {status.mode === 'auto' ? '🤖 Auto' : '👤 Manual'}
                            </span>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                    <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                    </span>
                </button>
            </div>

            {isExpanded && (
                <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Intelligent automation that demonstrates Signatex capabilities by automatically configuring optimal trading parameters and executing analysis.
                    </p>

                    {/* Mode Selection */}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mode:</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleModeChange('auto')}
                                disabled={status.isRunning}
                                className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                                    selectedMode === 'auto'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                🤖 Auto
                            </button>
                            <button
                                onClick={() => handleModeChange('manual')}
                                disabled={status.isRunning}
                                className={`px-3 py-1 text-xs rounded-full font-medium transition-all ${
                                    selectedMode === 'manual'
                                        ? 'bg-orange-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                👤 Manual
                            </button>
                        </div>
                    </div>

                    {/* Flow Prompt Section */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                🎯 Flow Guidance
                            </label>
                            <button
                                onClick={handleImprovePrompt}
                                disabled={status.isRunning || isGeneratingPrompt}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={flowPrompt.trim() ? 'Improve existing prompt' : 'Generate prompt suggestion'}
                            >
                                {isGeneratingPrompt ? (
                                    <div className="w-3 h-3 border border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M7 14c0-.55.45-1 1-1s1 .45 1 1-.45 1-1 1-1-.45-1-1zm7.5-3.5c0-.28-.22-.5-.5-.5s-.5.22-.5.5.22.5.5.5.5-.22.5-.5zm-1.5 5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zm-6-6c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zm9.5 1.5c0 .28-.22.5-.5.5s-.5-.22-.5-.5.22-.5.5-.5.5.22.5.5zm-2.5-5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zm-3 11c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zm5-5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5z"/>
                                    </svg>
                                )}
                                ✨ {flowPrompt.trim() ? 'Improve' : 'Generate'}
                            </button>
                        </div>
                        <div className="relative">
                            <textarea
                                value={flowPrompt}
                                onChange={(e) => handleFlowPromptChange(e.target.value)}
                                onBlur={handleFlowPromptBlur}
                                disabled={status.isRunning}
                                placeholder="Optional: Describe your trading strategy focus (e.g., 'Focus on dividend stocks with strong fundamentals' or 'Analyze crypto with technical indicators'). Leave empty for default flow."
                                className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 resize-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                rows={3}
                            />
                            {flowPrompt.trim() && (
                                <div className="absolute bottom-2 right-2">
                                    <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
                                        ✓ Custom guidance active
                                    </span>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            ProFlow will adapt its symbol selection and parameters based on your guidance. Use the ✨ wand to get suggestions or improve your prompt.
                        </p>
                    </div>

                    {status.isRunning && (
                        <div className="mb-3">
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                                <span>Current: {status.currentStepName}</span>
                                <span>{Math.round((status.currentStep / status.totalSteps) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${(status.currentStep / status.totalSteps) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Manual Mode Continue Button */}
                    {status.isPaused && selectedMode === 'manual' && (
                        <button
                            onClick={handleContinue}
                            className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-200 text-sm animate-pulse"
                        >
                            ▶️ Continue to Next Step
                        </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={handleStartProFlow}
                            disabled={status.isRunning}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed text-sm"
                        >
                            {status.isRunning ? 'Running...' : `🚀 Start ${selectedMode === 'auto' ? 'Auto' : 'Manual'}`}
                        </button>
                        
                        <button
                            onClick={handleStopProFlow}
                            disabled={!status.isRunning}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed text-sm"
                        >
                            🛑 Stop
                        </button>

                        <button
                            onClick={handleQuickDemo}
                            disabled={status.isRunning}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed text-sm"
                        >
                            ⚡ Quick Demo
                        </button>

                        <button
                            onClick={handleAdvancedAnalysis}
                            disabled={status.isRunning}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed text-sm"
                        >
                            🧠 Advanced
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
