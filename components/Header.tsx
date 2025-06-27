import React from 'react';

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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        )}
    </button>
);


interface HeaderProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, toggleTheme }) => {
    return (
        <header className="relative overflow-hidden mesh-gradient animate-gradient-xy text-white p-8 rounded-2xl shadow-2xl text-center card-glow sharp-corners">
            <div className="absolute inset-0 bg-black/10 dark:bg-white/5"></div>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            <div className="relative z-10">
                <div className="animate-float">
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-amber-100 drop-shadow-lg">
                        AI-Powered Trading Assistant
                    </h1>
                    <div className="flex items-center justify-center gap-2 mt-3">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                        <p className="text-blue-100 text-lg font-medium">Leveraging Gemini for Market Insights</p>
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse animation-delay-300"></div>
                    </div>
                </div>
                <div className="absolute top-4 left-4 w-16 h-16 bg-gradient-to-br from-cyan-400/20 to-amber-500/20 rounded-full blur-xl animate-pulse-slow"></div>
                <div className="absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-br from-blue-400/20 to-yellow-500/20 rounded-full blur-lg animate-pulse-slow animation-delay-1000"></div>
            </div>
        </header>
    );
};