import React, { useState } from 'react';
import type { AnalysisResult } from '../types.ts';
import { Position } from '../types.ts';
import { NewsSection } from './NewsSection.tsx';
import { ImageGallery } from './ImageGallery.tsx';
import { OptionsAnalysisSection } from './OptionsAnalysisSection.tsx';
import { OrderAnalysisSection } from './OrderAnalysisSection.tsx';
import { OpenInterestSection } from './OpenInterestSection.tsx';
import { ttsService } from '../services/ttsService.ts';

interface PositionResultProps {
    result: AnalysisResult;
    theme: 'light' | 'dark';
}

const PositionResult: React.FC<PositionResultProps> = ({ 
    result, 
    theme
}) => {
    const [showFullReasoning, setShowFullReasoning] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [audioCache, setAudioCache] = useState<Map<string, string>>(new Map());
    const currentAudioRef = React.useRef<HTMLAudioElement | null>(null);

    // TTS Functions
    const synthesizeAndPlayAnalysis = async () => {
        if (!ttsService.isAvailable()) {
            console.warn('TTS service not available');
            return;
        }

        try {
            setIsPlayingAudio(true);
            const analysisId = `analysis-${result.position}-${result.confidence}`;

            // Check cache first
            let audioDataUrl = audioCache.get(analysisId);

            if (!audioDataUrl) {
                // Create a comprehensive text summary for TTS
                const ttsText = `
                Trading Analysis Report.
                Recommended Position: ${result.position}.
                Confidence Level: ${result.confidence}.
                Detailed Analysis: ${result.reasoning}
                `;

                // Synthesize speech
                audioDataUrl = await ttsService.synthesizeSpeech({
                    text: ttsText,
                    languageCode: 'en-US',
                    voiceName: 'en-US-Studio-O',
                    ssmlGender: 'FEMALE',
                    speakingRate: 1.0,
                    pitch: 0.0
                });

                if (audioDataUrl) {
                    // Cache the audio
                    setAudioCache(prev => new Map(prev).set(analysisId, audioDataUrl!));
                }
            }

            if (audioDataUrl) {
                // Stop any currently playing audio
                if (currentAudioRef.current) {
                    currentAudioRef.current.pause();
                    currentAudioRef.current = null;
                }

                // Create and play new audio
                const audio = new Audio(audioDataUrl);
                currentAudioRef.current = audio;

                audio.onended = () => {
                    setIsPlayingAudio(false);
                    currentAudioRef.current = null;
                };

                audio.onerror = () => {
                    setIsPlayingAudio(false);
                    currentAudioRef.current = null;
                    console.error('Audio playback failed');
                };

                await audio.play();
            }
        } catch (error) {
            console.error('TTS error:', error);
            setIsPlayingAudio(false);
        }
    };

    const stopAudio = () => {
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }
        setIsPlayingAudio(false);
    };

    const getPositionColor = (position: Position) => {
        switch (position) {
            case Position.LONG:
                return 'text-green-600 dark:text-green-400';
            case Position.SHORT:
                return 'text-red-600 dark:text-red-400';
            case Position.HOLD:
                return 'text-yellow-600 dark:text-yellow-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    };

    const getPositionIcon = (position: Position) => {
        switch (position) {
            case Position.LONG:
                return '📈';
            case Position.SHORT:
                return '📉';
            case Position.HOLD:
                return '⏸️';
            default:
                return '❓';
        }
    };

    const truncateText = (text: string, maxLength: number = 200) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            {/* Header with Symbol and Position */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                    {result.symbol}
                </h3>
                 <div className="flex items-center space-x-3">
                    {/* TTS Controls */}
                    {ttsService.isAvailable() && (
                        <div className="flex gap-2">
                            {isPlayingAudio ? (
                                <button
                                    onClick={stopAudio}
                                    className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow transition-colors flex items-center gap-2"
                                    title="Stop audio analysis"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M6 6h12v12H6z"/>
                                    </svg>
                                    Stop Audio
                                </button>
                            ) : (
                                <button
                                    onClick={synthesizeAndPlayAnalysis}
                                    className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg shadow transition-colors flex items-center gap-2"
                                    title="Play audio analysis"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                    Play Analysis
                                </button>
                            )}
                            {audioCache.has(`analysis-${result.position}-${result.confidence}`) && (
                                <div className="bg-green-500 text-white p-2 rounded-lg shadow flex items-center gap-2" title="Audio cached">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                    </svg>
                                    Cached
                                </div>
                            )}
                        </div>
                    )}
                 </div>
                <div className={`text-lg font-semibold ${getPositionColor(result.position)}`}>
                    {getPositionIcon(result.position)} {result.position}
                </div>
            </div>

            {/* Symbol Logo */}
            {result.symbolLogo && result.symbolLogo.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Company Logo
                    </h4>
                    <ImageGallery 
                        images={result.symbolLogo} 
                        title="Company Logo" 
                        theme={theme}
                    />
                </div>
            )}

            {/* Confidence Score */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Confidence Score
                    </span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        {result.confidence}
                    </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${result.confidence}%` }}
                    ></div>
                </div>
            </div>

            {/* Reasoning */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Analysis Reasoning
                    </h4>
                    {result.reasoning && result.reasoning.length > 200 && (
                        <button
                            onClick={() => setShowFullReasoning(!showFullReasoning)}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
                        >
                            {showFullReasoning ? 'Show Less' : 'Show More'}
                        </button>
                    )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {showFullReasoning ? result.reasoning : truncateText(result.reasoning || '')}
                </p>
            </div>

            {/* Reasoning Illustrations */}
            {result.reasoningIllustrations && result.reasoningIllustrations.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Analysis Illustrations
                    </h4>
                    <ImageGallery 
                        images={result.reasoningIllustrations} 
                        title="Analysis Illustrations" 
                        theme={theme}
                    />
                </div>
            )}

            {/* Entry and Exit Points */}
            {(result.entryPoint || result.exitPoint) && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {result.entryPoint && (
                        <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Entry Point
                            </span>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                ${result.entryPoint.toFixed(2)}
                            </p>
                        </div>
                    )}
                    {result.exitPoint && (
                        <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Exit Point
                            </span>
                            <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                ${result.exitPoint.toFixed(2)}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* News Section */}
            {result.news && result.news.length > 0 && (
                <div className="mb-6">
                    <NewsSection news={result.news} theme={theme} />
                </div>
            )}

            {/* No News Message */}
            {(!result.news || result.news.length === 0) && (
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                        No news articles found for this analysis. This could indicate API configuration issues.
                    </p>
                </div>
            )}
        </div>
    );
};

export default PositionResult;