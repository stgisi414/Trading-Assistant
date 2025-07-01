
import React from 'react';

interface LoadingOverlayProps {
    isVisible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-800/90 to-slate-200/90 flex items-center justify-center transition-opacity duration-500 loading-overlay">
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
                    <h1 className="text-5xl sm:text-6xl font-black text-white mb-3 flex items-center justify-center gap-3 drop-shadow-2xl">
                        <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent filter drop-shadow-lg">
                            Signatex
                        </span>
                    </h1>
                    <p className="text-white text-xl sm:text-2xl font-semibold drop-shadow-lg">AI-Powered Trading Assistant</p>
                </div>

                {/* Loading text */}
                <div className="text-white">
                    <p className="text-lg sm:text-xl font-medium mb-3 drop-shadow-md">Initializing trading intelligence...</p>
                    <div className="flex justify-center items-center gap-2">
                        <div className="w-3 h-3 bg-white rounded-full animate-bounce drop-shadow-sm"></div>
                        <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-200 drop-shadow-sm"></div>
                        <div className="w-3 h-3 bg-white rounded-full animate-bounce animation-delay-400 drop-shadow-sm"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
