import React, { useState } from 'react';
import { SignatexChatbot } from './SignatexChatbot.tsx';
import { Moon, Sun, MessageCircle } from 'lucide-react';

interface ThemeToggleProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => (
    <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-20 p-3 rounded-full text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white transition-colors cursor-pointer"
        aria-label="Toggle theme"
        style={{ pointerEvents: 'auto' }}
    >
        {theme === 'light' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        )}
    </button>
);

interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    currentInputs?: {
        selectedSymbols: string[];
        walletAmount: string;
        selectedIndicators: string[];
        selectedNonTechnicalIndicators?: string[];
        selectedTimeframe: string;
        selectedMarketType: string;
        includeOptionsAnalysis?: boolean;
        includeCallOptions?: boolean;
        includePutOptions?: boolean;
        includeOrderAnalysis?: boolean;
        startDate?: string;
        endDate?: string;
    };
    analysisResults?: any[];
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme, currentInputs, analysisResults }) => {
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [showChatbot, setShowChatbot] = useState(false);

    return (
        <>
            <header className="glass-effect p-6 rounded-2xl shadow-2xl border-border backdrop-blur-xl card-glow sharp-corners relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/10 dark:to-transparent"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-2">
                                AI-Powered Trading Assistant
                            </h1>
                            <p className="text-lg text-muted dark:text-gray-300 mb-4">
                                Leveraging Gemini for Market Insights
                            </p>
                        </div>

                        <button
                            onClick={toggleTheme}
                            className="p-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border hover:bg-accent transition-all duration-300 text-foreground"
                            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                        >
                            {theme === 'light' ? (
                                <Moon className="w-5 h-5" />
                            ) : (
                                <Sun className="w-5 h-5 text-gray-300" />
                            )}
                        </button>
                    </div>
                    <div className="flex justify-center">
                        <button
                            onClick={() => setShowChatbot(true)}
                            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                            title="Open Signatex Assistant"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span className="hidden sm:inline">Ask Signatex</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Floating Chatbot Toggle */}
            <button
                onClick={() => setIsChatbotOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300"
                aria-label="Open Signatex Assistant"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            </button>

            {/* Signatex Chatbot */}
            <SignatexChatbot
                isOpen={isChatbotOpen}
                onClose={() => setIsChatbotOpen(false)}
                currentInputs={currentInputs}
                analysisResults={analysisResults}
            />
        </>
    );
};