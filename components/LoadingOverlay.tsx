
import React from 'react';

interface LoadingOverlayProps {
    isVisible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-800 to-slate-200 flex items-center justify-center z-[9999] transition-opacity duration-500">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="shooting-streaks">
                    <div className="streak streak-blue streak-1"></div>
                    <div className="streak streak-purple streak-2"></div>
                    <div className="streak streak-blue streak-3"></div>
                    <div className="streak streak-purple streak-4"></div>
                    <div className="streak streak-blue streak-5"></div>
                </div>
            </div>

            {/* Loading content */}
            <div className="relative z-10 text-center">
                {/* Main loader */}
                <div className="mb-8">
                    <div className="relative">
                        {/* Outer rotating ring */}
                        <div className="w-24 h-24 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                        
                        {/* Inner pulsing dot */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 bg-blue-600 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* Branding */}
                <div className="mb-6">
                    <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                        <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                            Signatex
                        </span>
                    </h1>
                    <p className="text-blue-200 text-lg">AI-Powered Trading Assistant</p>
                </div>

                {/* Loading text */}
                <div className="text-blue-300">
                    <p className="text-sm mb-2">Initializing trading intelligence...</p>
                    <div className="flex justify-center items-center gap-1">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce animation-delay-200"></div>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce animation-delay-400"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
