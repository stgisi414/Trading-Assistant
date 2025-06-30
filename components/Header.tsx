import React, { useState } from "react";
import { SignatexChatbot } from "./SignatexChatbot.tsx";
import { Moon, Sun, MessageCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface ThemeToggleProps {
    theme: "light" | "dark";
    toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => (
    <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-20 p-3 rounded-full text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white transition-colors cursor-pointer"
        aria-label="Toggle theme"
        style={{ pointerEvents: "auto" }}
    >
        {theme === "light" ? (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
            </svg>
        ) : (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
            </svg>
        )}
    </button>
);

interface HeaderProps {
    theme: "light" | "dark";
    onToggleTheme: () => void;
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
    profitMaxResult?: any;
    proFlowStatus?: {
        isRunning: boolean;
        currentStep: number;
        totalSteps: number;
        currentStepName: string;
        mode: string;
        isPaused: boolean;
    };
    onUpdateInputs?: (updates: any) => void;
    handleChatbotInputUpdates?: (updates: any) => void;
    onSignInClick: () => void;
    userProfile: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
    theme,
    onToggleTheme,
    currentInputs,
    analysisResults,
    profitMaxResult,
    proFlowStatus,
    onUpdateInputs,
    onSignInClick,
    userProfile,
    handleChatbotInputUpdates,
}) => {
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const { user, isLoading, isAuthRedirectPending } = useAuth();

    return (
        <>
            <header className="glass-effect p-6 rounded-2xl shadow-2xl border-border backdrop-blur-xl card-glow sharp-corners relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/10 dark:to-transparent"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-2 flex items-center gap-3">
                                <span className="material-symbols-outlined text-4xl md:text-5xl text-indigo-600 dark:text-indigo-400">
                                    finance
                                </span>
                                AI-Powered Trading Assistant
                            </h1>
                            <p className="text-lg text-muted dark:text-gray-300 mb-4 ml-12 md:ml-15">
                                Leveraging Gemini for Market Insights
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={onToggleTheme}
                                className="p-3 rounded-xl bg-card/80 backdrop-blur-sm border border-border hover:bg-accent transition-all duration-300 text-foreground"
                                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                            >
                                {theme === "light" ? (
                                    <Moon className="w-5 h-5" />
                                ) : (
                                    <Sun className="w-5 h-5 text-gray-300" />
                                )}
                            </button>

                            {/* Authentication Section */}
                            {user ? (
                                userProfile
                            ) : isLoading || isAuthRedirectPending ? (
                                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm">
                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    <span>
                                        {isAuthRedirectPending
                                            ? "Signing in..."
                                            : "Loading..."}
                                    </span>
                                </div>
                            ) : (
                                <button
                                    onClick={onSignInClick}
                                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-lg transition-all duration-300 hover:scale-105 text-sm font-medium shadow-sm"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            fill="#4285F4"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setIsChatbotOpen(true)}
                            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                            title="Open Signatex Assistant"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span className="hidden sm:inline">
                                Ask <span className="signatex-embossed">S</span>
                                ignatex
                            </span>
                        </button>

                        <button
                            onClick={() =>
                                window.dispatchEvent(
                                    new CustomEvent("toggleDebugPage"),
                                )
                            }
                            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-yellow-600 text-white hover:bg-yellow-700 font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                            title="Toggle Debug Console"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                            <span className="hidden sm:inline">
                                Debug Console
                            </span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Floating Chatbot Toggle */}
            <button
                onClick={() => setIsChatbotOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300"
                aria-label="Open Signatex Assistant"
                title="Open Signatex Assistant"
            >
                <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>
            </button>

            {/* Signatex Chatbot */}
            <SignatexChatbot
                isOpen={isChatbotOpen}
                onClose={() => setIsChatbotOpen(false)}
                currentInputs={currentInputs}
                analysisResults={analysisResults}
                profitMaxResult={profitMaxResult}
                proFlowStatus={proFlowStatus}
                onUpdateInputs={onUpdateInputs}
                handleChatbotInputUpdates={handleChatbotInputUpdates}
            />
        </>
    );
};