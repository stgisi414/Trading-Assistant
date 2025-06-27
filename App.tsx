import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { InputSection } from './components/InputSection.tsx';
import { ResultsSection } from './components/ResultsSection.tsx';
import { getTradingPosition } from './services/geminiService.ts';
import { fetchHistoricalData } from './services/marketDataService.ts';
import { analyzeChartPatterns } from './services/patternAnalysisService.ts';
import type { AnalysisResult, HistoricalDataPoint, AssetAnalysis } from './types.ts';
import { MarketType } from './types.ts';
import { INDICATOR_OPTIONS, NON_TECHNICAL_INDICATOR_OPTIONS, TIMEFRAME_OPTIONS, MARKET_OPTIONS } from './constants.ts';
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
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        // Initialize theme from localStorage or system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
            return savedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    const [selectedSymbols, setSelectedSymbols] = useState<string[]>(() => {
        const saved = localStorage.getItem('tradingApp_selectedSymbols');
        return saved ? JSON.parse(saved) : ['AAPL'];
    });
    const [walletAmount, setWalletAmount] = useState(() => {
        const saved = localStorage.getItem('tradingApp_walletAmount');
        return saved || '10000';
    });
    const [selectedIndicators, setSelectedIndicators] = useState<string[]>(() => {
        const saved = localStorage.getItem('tradingApp_selectedIndicators');
        return saved ? JSON.parse(saved) : ['SMA', 'RSI', 'Volume'];
    });
    const [selectedNonTechnicalIndicators, setSelectedNonTechnicalIndicators] = useState<string[]>(() => {
        const saved = localStorage.getItem('tradingApp_selectedNonTechnicalIndicators');
        return saved ? JSON.parse(saved) : [];
    });
    const [selectedTimeframe, setSelectedTimeframe] = useState<string>(() => {
        const saved = localStorage.getItem('tradingApp_selectedTimeframe');
        return saved || '1M';
    });
    const [dates, setDates] = useState(() => {
        const saved = localStorage.getItem('tradingApp_dates');
        return saved ? JSON.parse(saved) : getInitialDates();
    });
    const [includeOptionsAnalysis, setIncludeOptionsAnalysis] = useState(() => {
        const saved = localStorage.getItem('tradingApp_includeOptionsAnalysis');
        return saved ? JSON.parse(saved) : false;
    });
    const [includeCallOptions, setIncludeCallOptions] = useState(() => {
        const saved = localStorage.getItem('tradingApp_includeCallOptions');
        return saved ? JSON.parse(saved) : true;
    });
    const [includePutOptions, setIncludePutOptions] = useState(() => {
        const saved = localStorage.getItem('tradingApp_includePutOptions');
        return saved ? JSON.parse(saved) : true;
    });
    const [includeOrderAnalysis, setIncludeOrderAnalysis] = useState(() => {
        const saved = localStorage.getItem('tradingApp_includeOrderAnalysis');
        return saved ? JSON.parse(saved) : false;
    });
    const [selectedMarketType, setSelectedMarketType] = useState<MarketType>(() => {
        const saved = localStorage.getItem('tradingApp_selectedMarketType');
        return saved ? JSON.parse(saved) : MarketType.STOCKS;
    });
    const [selectedMarket, setSelectedMarket] = useState<string>(() => {
        const saved = localStorage.getItem('tradingApp_selectedMarket');
        return saved || 'US';
    });
    const [analyses, setAnalyses] = useState<AssetAnalysis[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        root.classList.add(theme);
    }, [theme]);

    // Save input data to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('tradingApp_selectedSymbols', JSON.stringify(selectedSymbols));
    }, [selectedSymbols]);

    useEffect(() => {
        localStorage.setItem('tradingApp_walletAmount', walletAmount);
    }, [walletAmount]);

    useEffect(() => {
        localStorage.setItem('tradingApp_selectedIndicators', JSON.stringify(selectedIndicators));
    }, [selectedIndicators]);

    useEffect(() => {
        localStorage.setItem('tradingApp_selectedNonTechnicalIndicators', JSON.stringify(selectedNonTechnicalIndicators));
    }, [selectedNonTechnicalIndicators]);

    useEffect(() => {
        localStorage.setItem('tradingApp_selectedTimeframe', selectedTimeframe);
    }, [selectedTimeframe]);

    useEffect(() => {
        localStorage.setItem('tradingApp_dates', JSON.stringify(dates));
    }, [dates]);

    useEffect(() => {
        localStorage.setItem('tradingApp_includeOptionsAnalysis', JSON.stringify(includeOptionsAnalysis));
    }, [includeOptionsAnalysis]);

    useEffect(() => {
        localStorage.setItem('tradingApp_includeCallOptions', JSON.stringify(includeCallOptions));
    }, [includeCallOptions]);

    useEffect(() => {
        localStorage.setItem('tradingApp_includePutOptions', JSON.stringify(includePutOptions));
    }, [includePutOptions]);

    useEffect(() => {
        localStorage.setItem('tradingApp_includeOrderAnalysis', JSON.stringify(includeOrderAnalysis));
    }, [includeOrderAnalysis]);

    useEffect(() => {
        localStorage.setItem('tradingApp_selectedMarketType', JSON.stringify(selectedMarketType));
    }, [selectedMarketType]);

    useEffect(() => {
        localStorage.setItem('tradingApp_selectedMarket', selectedMarket);
    }, [selectedMarket]);

    const toggleTheme = () => {
        setTheme(prev => {
            const newTheme = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            return newTheme;
        });
    };

    const handleAnalyze = useCallback(async () => {
        if (selectedSymbols.length === 0 || !walletAmount || parseFloat(walletAmount) <= 0 || selectedIndicators.length === 0 || !selectedTimeframe) {
            setError("Please select at least one asset symbol, enter a positive wallet amount, select at least one indicator, and choose a timeframe.");
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
                    // Fetch historical data - now guaranteed to return data
                    const historicalData = await fetchHistoricalData(symbol, selectedTimeframe, dates.startDate, dates.endDate);

                    // The service now always returns data, so we should always have something to analyze
                    if (!historicalData || historicalData.length === 0) {
                        console.error(`Critical error: No data returned for ${symbol}`);
                        setAnalyses(prev => prev.map(a => a.symbol === symbol ? { 
                            ...a, 
                            isLoading: false, 
                            error: `Unable to generate data for ${symbol}. Please try again.` 
                        } : a));
                        return;
                    }

                    console.log(`✅ Successfully loaded ${historicalData.length} data points for ${symbol}`)

                    setAnalyses(prev => prev.map(a => a.symbol === symbol ? { ...a, historicalData } : a));

                    const result = await getTradingPosition(symbol, parseFloat(walletAmount), selectedIndicators, historicalData);
                    const patterns = await analyzeChartPatterns(symbol, historicalData, selectedIndicators);

                    setAnalyses(prev => prev.map(a => a.symbol === symbol ? { 
                        ...a, 
                        isLoading: false, 
                        analysisResult: result,
                        patternDetails: patterns 
                    } : a));

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
    }, [selectedSymbols, walletAmount, selectedIndicators, selectedTimeframe, dates]);

    return (
        <div className="text-gray-800 dark:text-gray-200 min-h-screen p-4 sm:p-6 md:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-amber-50/30 to-cyan-50/50 dark:from-blue-950/30 dark:via-amber-950/20 dark:to-cyan-950/30"></div>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-amber-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-r from-cyan-400/10 to-indigo-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000"></div>

            <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-8">
                <Header theme={theme} toggleTheme={toggleTheme} />
                <main className="flex flex-col gap-3">
                    <div className="glass-effect p-6 sm:p-8 rounded-2xl shadow-2xl border backdrop-blur-xl card-glow sharp-corners relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/10 dark:to-transparent"></div>
                        <div className="relative z-10">
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
                                selectedNonTechnicalIndicators={selectedNonTechnicalIndicators}
                                setSelectedNonTechnicalIndicators={setSelectedNonTechnicalIndicators}
                                nonTechnicalIndicatorOptions={NON_TECHNICAL_INDICATOR_OPTIONS}
                                selectedTimeframe={selectedTimeframe}
                                setSelectedTimeframe={setSelectedTimeframe}
                                timeframeOptions={TIMEFRAME_OPTIONS}
                                selectedMarketType={selectedMarketType}
                                setSelectedMarketType={setSelectedMarketType}
                                selectedMarket={selectedMarket}
                                setSelectedMarket={setSelectedMarket}
                                marketOptions={MARKET_OPTIONS[selectedMarketType] || []}
                                includeOptionsAnalysis={includeOptionsAnalysis}
                                setIncludeOptionsAnalysis={setIncludeOptionsAnalysis}
                                includeCallOptions={includeCallOptions}
                                setIncludeCallOptions={setIncludeCallOptions}
                                includePutOptions={includePutOptions}
                                setIncludePutOptions={setIncludePutOptions}
                                includeOrderAnalysis={includeOrderAnalysis}
                                setIncludeOrderAnalysis={setIncludeOrderAnalysis}
                                onAnalyze={handleAnalyze}
                                isLoading={isLoading}
                            />
                        </div>
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