import React from 'react';

interface ThemeToggleProps {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => (
    <button
        onClick={toggleTheme}
        className="absolute top-1/2 -translate-y-1/2 right-4 p-2 rounded-full text-indigo-200 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white transition-colors"
        aria-label="Toggle theme"
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
        <header className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-xl shadow-lg text-center">
             <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            <h1 className="text-3xl md:text-4xl font-bold">AI-Powered Trading Assistant</h1>
            <p className="text-indigo-200 mt-2">Leveraging Gemini for Market Insights</p>
        </header>
    );
};