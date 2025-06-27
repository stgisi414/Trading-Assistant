import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { InputSection } from './components/InputSection.tsx';
import { ResultsSection } from './components/ResultsSection.tsx';
import { getTradingPosition } from './services/geminiService.ts';
import { fetchHistoricalData } from './services/marketDataService.ts';
import type { AnalysisResult, HistoricalDataPoint, AssetAnalysis } from './types.ts';
import { INDICATOR_OPTIONS } from './constants.ts';
import { ErrorMessage } from './components/ErrorMessage.tsx';

const getInitialDates = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
    };
};

function App() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['AAPL']);
    const [walletAmount, setWalletAmount] = useState('10000');
    const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['SMA', 'RSI', 'Volume']);
    const [dates, setDates] = useState(getInitialDates());
    const [analyses, setAnalyses] = useState<AssetAnalysis[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        root.classList.add(theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

    const handleAnalyze = useCallback(async () => {
        if (selectedSymbols.length === 0 || !walletAmount || parseFloat(walletAmount) <= 0 || selectedIndicators.length === 0) {
            setError("Please select at least one asset symbol, enter a positive wallet amount, and select at least one indicator.");
            return;
        }

        setIsLoading(true);
        setError(null);
        
        const initialAnalyses: AssetAnalysis[] = selectedSymbols.map(symbol => ({
            symbol,
            isLoading: true,
            error: undefined,
            historicalData: [],
            analysisResult: null,
        }));
        setAnalyses(initialAnalyses);

        try {
            const analysisPromises = selectedSymbols.map(async (symbol, index) => {
                try {
                    const data = await fetchHistoricalData(symbol, dates.startDate, dates.endDate);
                    
                    setAnalyses(prev => prev.map(a => a.symbol === symbol ? { ...a, historicalData: data } : a));

                    const result = await getTradingPosition(symbol, parseFloat(walletAmount), selectedIndicators, data);
                    
                    setAnalyses(prev => prev.map(a => a.symbol === symbol ? { ...a, isLoading: false, analysisResult: result } : a));

                } catch(err) {
                    const errorMessage = err instanceof Error ? err.message : String(err);
                    setAnalyses(prev => prev.map(a => a.symbol === symbol ? { ...a, isLoading: false, error: errorMessage } : a));
                }
            });

            await Promise.all(analysisPromises);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during setup.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [selectedSymbols, walletAmount, selectedIndicators, dates]);

    return (
        <div className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto flex flex-col gap-8">
                <Header theme={theme} toggleTheme={toggleTheme} />
                <main className="flex flex-col gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg">
                        <InputSection
                            selectedSymbols={selectedSymbols}
                            setSelectedSymbols={setSelectedSymbols}
                            walletAmount={walletAmount}
                            setWalletAmount={setWalletAmount}
                            startDate={dates.startDate}
                            setStartDate={(d) => setDates(prev => ({...prev, startDate: d}))}
                            endDate={dates.endDate}
                            setEndDate={(d) => setDates(prev => ({...prev, endDate: d}))}
                            selectedIndicators={selectedIndicators}
                            setSelectedIndicators={setSelectedIndicators}
                            indicatorOptions={INDICATOR_OPTIONS}
                            onAnalyze={handleAnalyze}
                            isLoading={isLoading}
                        />
                    </div>
                    {error && <ErrorMessage message={error} />}
                    <ResultsSection
                        analyses={analyses}
                        theme={theme}
                        isLoading={isLoading}
                    />
                </main>
            </div>
        </div>
    );
}

export default App;