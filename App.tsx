import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Header } from "./components/Header.tsx";
import { InputSection } from "./components/InputSection.tsx";
import { ResultsSection } from "./components/ResultsSection.tsx";
import { ProfitMaxModal } from "./components/ProfitMaxModal.tsx";
import { ProfitMaxResultsModal } from "./components/ProfitMaxResultsModal.tsx";
import { DebugPage } from './components/DebugPage.tsx';
import { ProFlowControls } from './components/ProFlowControls.tsx';
import { ProFlowToastContainer } from './components/ProFlowToast.tsx';
import type { ProFlowToast } from './services/proFlowService.ts';
import { getTradingPosition } from "./services/geminiService.ts";
import { fetchHistoricalData } from "./services/marketDataService.ts";
import { analyzeChartPatterns } from "./services/patternAnalysisService.ts";
import { proFlowService } from "./services/proFlowService.ts";
import type {
    HistoricalData,
    AnalysisResult,
FmpSearchResult,
    AppState,
    AssetAnalysis,
} from "./types.ts";
import { MarketType } from "./types.ts";
import type { OptimizationResult } from "./services/profitMaxService.ts";
import {
    INDICATOR_OPTIONS,
    NON_TECHNICAL_INDICATOR_OPTIONS,
    TIMEFRAME_OPTIONS,
    MARKET_OPTIONS,
} from "./constants.ts";
import { ErrorMessage } from "./components/ErrorMessage.tsx";
import { SymbolDebugger } from "./components/SymbolDebugger.tsx";

const getInitialDates = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    return {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
    };
};

function App() {
    const [theme, setTheme] = useState<"light" | "dark">(() => {
        // Initialize theme from localStorage or system preference
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark" || savedTheme === "light") {
            return savedTheme;
        }
        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    });
    const [selectedSymbols, setSelectedSymbols] = useState<FmpSearchResult[]>(
        [],
    );
    const [walletAmount, setWalletAmount] = useState(() => {
        const saved = localStorage.getItem("tradingApp_walletAmount");
        return saved || "10000";
    });
    const [selectedIndicators, setSelectedIndicators] = useState<string[]>(
        () => {
            const saved = localStorage.getItem("tradingApp_selectedIndicators");
            return saved ? JSON.parse(saved) : ["SMA", "RSI", "Volume"];
        },
    );
    const [selectedNonTechnicalIndicators, setSelectedNonTechnicalIndicators] =
        useState<string[]>(() => {
            const saved = localStorage.getItem(
                "tradingApp_selectedNonTechnicalIndicators",
            );
            return saved ? JSON.parse(saved) : [];
        });
    const [selectedTimeframe, setSelectedTimeframe] = useState<string>(() => {
        const saved = localStorage.getItem("tradingApp_selectedTimeframe");
        return saved || "1M";
    });
    const [dates, setDates] = useState(() => {
        const saved = localStorage.getItem("tradingApp_dates");
        return saved ? JSON.parse(saved) : getInitialDates();
    });
    const [includeOptionsAnalysis, setIncludeOptionsAnalysis] = useState(() => {
        const saved = localStorage.getItem("tradingApp_includeOptionsAnalysis");
        return saved ? JSON.parse(saved) : false;
    });
    const [includeCallOptions, setIncludeCallOptions] = useState(() => {
        const saved = localStorage.getItem("tradingApp_includeCallOptions");
        return saved ? JSON.parse(saved) : true;
    });
    const [includePutOptions, setIncludePutOptions] = useState(() => {
        const saved = localStorage.getItem("tradingApp_includePutOptions");
        return saved ? JSON.parse(saved) : true;
    });
    const [includeOrderAnalysis, setIncludeOrderAnalysis] = useState(() => {
        const saved = localStorage.getItem("tradingApp_includeOrderAnalysis");
        return saved ? JSON.parse(saved) : false;
    });
    const [selectedMarketType, setSelectedMarketType] = useState<MarketType>(
        () => {
            const saved = localStorage.getItem("tradingApp_selectedMarketType");
            return saved ? JSON.parse(saved) : MarketType.STOCKS;
        },
    );
    const [selectedMarket, setSelectedMarket] = useState<string>(() => {
        const saved = localStorage.getItem("tradingApp_selectedMarket");
        return saved || "US";
    });
    const [analyses, setAnalyses] = useState<AssetAnalysis[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ProfitMax state
    const [isProfitMaxModalOpen, setIsProfitMaxModalOpen] = useState(false);
    const [isProfitMaxResultsModalOpen, setIsProfitMaxResultsModalOpen] = useState(false);
    const [profitMaxResult, setProfitMaxResult] = useState<OptimizationResult | null>(null);
    const [showProfitMaxResults, setShowProfitMaxResults] = useState(false);
    const [profitMaxResults, setProfitMaxResults] = useState<any>(null);
    const [showDebugPage, setShowDebugPage] = useState(false);

    // ProFlow state
    const [proFlowToasts, setProFlowToasts] = useState<ProFlowToast[]>([]);
    const [proFlowStatus, setProFlowStatus] = useState(() => {
        // Import at the top level instead of using require
        return { isRunning: false, currentStep: 0, totalSteps: 0, currentStepName: 'Idle', mode: 'auto', isPaused: false };
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === "light" ? "dark" : "light");
        root.classList.add(theme);
    }, [theme]);

    // Save selected symbols to localStorage whenever they change
    useEffect(() => {
        console.log('🔧 Saving selectedSymbols to localStorage:', selectedSymbols);
        // Ensure we're saving complete objects with both symbol and name
        const symbolsToSave = selectedSymbols.map(s => ({
            symbol: s.symbol,
            name: s.name || `${s.symbol} Corporation`
        }));
        localStorage.setItem('selectedSymbols', JSON.stringify(symbolsToSave));
        console.log('🔧 localStorage updated for selectedSymbols');
    }, [selectedSymbols]);

    useEffect(() => {
        localStorage.setItem("tradingApp_walletAmount", walletAmount);
    }, [walletAmount]);

    useEffect(() => {
        localStorage.setItem(
            "tradingApp_selectedIndicators",
            JSON.stringify(selectedIndicators),
        );
    }, [selectedIndicators]);

    useEffect(() => {
        localStorage.setItem(
            "tradingApp_selectedNonTechnicalIndicators",
            JSON.stringify(selectedNonTechnicalIndicators),
        );
    }, [selectedNonTechnicalIndicators]);

    useEffect(() => {
        localStorage.setItem("tradingApp_selectedTimeframe", selectedTimeframe);
    }, [selectedTimeframe]);

    useEffect(() => {
        localStorage.setItem("tradingApp_dates", JSON.stringify(dates));
    }, [dates]);

    useEffect(() => {
        localStorage.setItem(
            "tradingApp_includeOptionsAnalysis",
            JSON.stringify(includeOptionsAnalysis),
        );
    }, [includeOptionsAnalysis]);

    useEffect(() => {
        localStorage.setItem(
            "tradingApp_includeCallOptions",
            JSON.stringify(includeCallOptions),
        );
    }, [includeCallOptions]);

    useEffect(() => {
        localStorage.setItem(
            "tradingApp_includePutOptions",
            JSON.stringify(includePutOptions),
        );
    }, [includePutOptions]);

    useEffect(() => {
        localStorage.setItem(
            "tradingApp_includeOrderAnalysis",
            JSON.stringify(includeOrderAnalysis),
        );
    }, [includeOrderAnalysis]);

    useEffect(() => {
        localStorage.setItem(
            "tradingApp_selectedMarketType",
            JSON.stringify(selectedMarketType),
        );
    }, [selectedMarketType]);

    useEffect(() => {
        localStorage.setItem("tradingApp_selectedMarket", selectedMarket);
    }, [selectedMarket]);

    // Load data from localStorage on component mount
    useEffect(() => {
        try {
            const savedSymbols = localStorage.getItem('selectedSymbols');
            const savedWalletAmount = localStorage.getItem('walletAmount');
            const savedIndicators = localStorage.getItem('selectedIndicators');
            const savedNonTechnicalIndicators = localStorage.getItem('selectedNonTechnicalIndicators');
            const savedTimeframe = localStorage.getItem('selectedTimeframe');
            const savedMarketType = localStorage.getItem('selectedMarketType');
            const savedMarket = localStorage.getItem('selectedMarket');
            const savedIncludeOptionsAnalysis = localStorage.getItem('includeOptionsAnalysis');
            const savedIncludeCallOptions = localStorage.getItem('includeCallOptions');
            const savedIncludePutOptions = localStorage.getItem('includePutOptions');
            const savedIncludeOrderAnalysis = localStorage.getItem('includeOrderAnalysis');

            if (savedSymbols) {
                console.log('📂 Loading selectedSymbols from localStorage:', savedSymbols);
                const parsedSymbols = JSON.parse(savedSymbols);
                // Ensure each symbol has both symbol and name properties
                const validatedSymbols = parsedSymbols.map((s: any) => ({
                    symbol: s.symbol || s,
                    name: s.name || `${s.symbol || s} Corporation`
                }));
                setSelectedSymbols(validatedSymbols);
            }
            if (savedWalletAmount) setWalletAmount(savedWalletAmount);
            if (savedIndicators) setSelectedIndicators(JSON.parse(savedIndicators));
            if (savedNonTechnicalIndicators) setSelectedNonTechnicalIndicators(JSON.parse(savedNonTechnicalIndicators));
            if (savedTimeframe) setSelectedTimeframe(savedTimeframe);
            if (savedMarketType) setSelectedMarketType(savedMarketType as MarketType);
            if (savedMarket) setSelectedMarket(savedMarket);
            if (savedIncludeOptionsAnalysis) setIncludeOptionsAnalysis(JSON.parse(savedIncludeOptionsAnalysis));
            if (savedIncludeCallOptions) setIncludeCallOptions(JSON.parse(savedIncludeCallOptions));
            if (savedIncludePutOptions) setIncludePutOptions(JSON.parse(savedIncludePutOptions));
            if (savedIncludeOrderAnalysis) setIncludeOrderAnalysis(JSON.parse(savedIncludeOrderAnalysis));
        } catch (error) {
            console.error('❌ Error loading from localStorage:', error);
        }
    }, []);

    const onAddSymbol = (symbol: FmpSearchResult) => {
        console.log('🔧 onAddSymbol called with:', symbol);
        console.log('🔧 Current selectedSymbols before addition:', selectedSymbols);
        console.log('🔧 Symbol validation:', {
            symbol: symbol.symbol,
            name: symbol.name,
            isValidSymbol: typeof symbol.symbol === 'string' && symbol.symbol.length > 0,
            isValidName: typeof symbol.name === 'string' && symbol.name.length > 0
        });

        // Check if symbol already exists
        const existingSymbol = selectedSymbols.find(s => s.symbol === symbol.symbol);
        if (existingSymbol) {
            console.log('⚠️ Symbol already exists, not adding:', existingSymbol);
            return;
        }

        console.log('✅ Adding new symbol to state...');
        setSelectedSymbols(prev => {
            const newSymbols = [...prev, symbol];
            console.log('🔧 New symbols array:', newSymbols);
            return newSymbols;
        });
    };

    const onRemoveSymbol = (symbol: string) => {
        console.log('🔧 onRemoveSymbol called with:', symbol);
        console.log('🔧 Current selectedSymbols before removal:', selectedSymbols);

        const symbolExists = selectedSymbols.find(s => s.symbol === symbol);
        if (!symbolExists) {
            console.log('⚠️ Symbol not found in list, cannot remove:', symbol);
            return;
        }

        console.log('✅ Removing symbol from state...');
        setSelectedSymbols(prev => {
            const newSymbols = prev.filter(s => s.symbol !== symbol);
            console.log('🔧 New symbols array after removal:', newSymbols);
            return newSymbols;
        });
    };

    const toggleTheme = () => {
        setTheme((prev) => {
            const newTheme = prev === "light" ? "dark" : "light";
            localStorage.setItem("theme", newTheme);
            return newTheme;
        });
    };

    const handleMarketTypeChange = (newMarketType: string) => {
        console.log('🔧 Changing market type from', selectedMarketType, 'to', newMarketType);

        setSelectedMarketType(newMarketType as MarketType);
        const newMarket = MARKET_OPTIONS[newMarketType]?.[0]?.value || "";
        setSelectedMarket(newMarket);

        // Clear symbols when switching market types since they're incompatible
        console.log('🔧 Clearing symbols due to market type change:', selectedSymbols.map(s => s.symbol));
        setSelectedSymbols([]);
    };

    const handleMarketChange = (newMarket: string) => {
        console.log('🔧 Changing market from', selectedMarket, 'to', newMarket);
        setSelectedMarket(newMarket);

        // For some market types like COMMODITIES/CRYPTO/FOREX, different markets have different symbols
        // So we should clear symbols when switching between them
        if (selectedMarketType !== MarketType.STOCKS) {
            console.log('🔧 Clearing symbols due to market change in non-stocks market:', selectedSymbols.map(s => s.symbol));
            setSelectedSymbols([]);
        }
    };

    const calculateStartDateFromTimeframe = (timeframe: string, endDate: string): string => {
        const end = new Date(endDate);
        const timeframeLower = timeframe.toLowerCase();

        let daysToSubtract = 30; // default

        // Minutes/Hours - same day
        if (timeframeLower.includes('m') && !timeframeLower.includes('m')) {
            // Handle minutes (5m, 15m, 30m) and hours (1h, 4h, 12h)
            if (timeframeLower.endsWith('m') || timeframeLower.endsWith('h')) {
                daysToSubtract = 1; // Same day for intraday
            }
        }
        // Daily timeframes
        else if (timeframeLower === '1d') {
            daysToSubtract = 1; // Same day for 1-day timeframe
        }
        else if (timeframeLower === '3d') {
            daysToSubtract = 3; // 3 days for 3-day timeframe
        }
        else if (timeframeLower === '7d') {
            daysToSubtract = 7; // 1 week
        }
        // Weekly timeframes
        else if (timeframeLower === '2w') {
            daysToSubtract = 14; // 2 weeks
        }
        // Monthly timeframes (handling both lowercase and uppercase)
        else if (timeframeLower === '1m') {
            daysToSubtract = 30; // 1 month
        }
        else if (timeframeLower === '3m') {
            daysToSubtract = 90; // 3 months
        }
        else if (timeframeLower === '6m') {
            daysToSubtract = 180; // 6 months
        }
        // Yearly timeframes
        else if (timeframeLower === '1y') {
            daysToSubtract = 365; // 1 year
        }
        else if (timeframeLower === '2y') {
            daysToSubtract = 730; // 2 years
        }
        else if (timeframeLower === '5y') {
            daysToSubtract = 1825; // 5 years
        }
        // Handle minute/hour timeframes specifically
        else if (timeframeLower === '5m' || timeframeLower === '15m' || timeframeLower === '30m' || 
                 timeframeLower === '1h' || timeframeLower === '4h' || timeframeLower === '12h') {
            daysToSubtract = 1; // Same day for intraday timeframes
        }

        const startDate = new Date(end.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
        return startDate.toISOString().split('T')[0];
    };

    const handleTimeframeChange = (newTimeframe: string) => {
        setSelectedTimeframe(newTimeframe);
        // Only automatically adjust start date for non-custom timeframes
        if (newTimeframe !== 'custom') {
            const newStartDate = calculateStartDateFromTimeframe(newTimeframe, dates.endDate);
            setDates(prev => ({
                ...prev,
                startDate: newStartDate
            }));
        }
    };

    const handleProfitMaxOptimization = (result: OptimizationResult) => {
        setProfitMaxResult(result);
        setIsProfitMaxResultsModalOpen(true);
    };

    const handleApplyProfitMaxResults = () => {
        if (profitMaxResult) {
            // Apply optimized settings
            setSelectedSymbols(profitMaxResult.bestSymbols);
            setWalletAmount(profitMaxResult.bestWalletAmount.toString());
            setSelectedIndicators(profitMaxResult.bestIndicators);
            setSelectedTimeframe(profitMaxResult.bestTimeframe);
            setAnalyses(profitMaxResult.analyses);

            // Persist the profitMaxResult so the chatbot knows it has been run
            // This is the missing piece of the puzzle.
            // You can also save it to localStorage if you want it to persist across sessions.
            localStorage.setItem("tradingApp_profitMaxResult", JSON.stringify(profitMaxResult));
        }
    };

    // Also, make sure to load this from localStorage when the app starts
    useEffect(() => {
        const savedProfitMaxResult = localStorage.getItem("tradingApp_profitMaxResult");
        if (savedProfitMaxResult) {
            setProfitMaxResult(JSON.parse(savedProfitMaxResult));
        }
    }, []);

    // ProFlow helper functions
    const handleShowToast = (toast: ProFlowToast) => {
        setProFlowToasts(prev => [...prev, toast]);
    };

    const handleRemoveToast = (id: string) => {
        setProFlowToasts(prev => prev.filter(toast => toast.id !== id));
    };

    // Update ProFlow status periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setProFlowStatus(proFlowService.getStatus());
        }, 500);

        return () => clearInterval(interval);
    }, []);

    const currentMarketSymbols = useMemo(() => {
        // Depend on your original state variables
        if (!selectedMarketType || !selectedMarket) return []; 
        const marketData = MARKET_OPTIONS[selectedMarketType]?.find(m => m.value === selectedMarket);
        return marketData?.symbols?.map(s => s.symbol) || [];
    }, [selectedMarketType, selectedMarket]); // Update dependencies

      // Only filter symbols when user manually changes market, not during chatbot updates
      useEffect(() => {
        // Don't filter if we have no market symbols defined (means we're in a generic market)
        if (currentMarketSymbols.length === 0) return;

        setSelectedSymbols(prevSymbols => {
          const filtered = prevSymbols.filter(symbolObj => currentMarketSymbols.includes(symbolObj.symbol));
          // Only update if there's actually a change to prevent unnecessary re-renders
          if (filtered.length !== prevSymbols.length) {
            console.log('🔧 Filtering symbols due to market change:', { 
              before: prevSymbols.map(s => s.symbol), 
              after: filtered.map(s => s.symbol),
              marketSymbols: currentMarketSymbols 
            });
            return filtered;
          }
          return prevSymbols;
        });
      }, [currentMarketSymbols]);

    const handleAnalyze = useCallback(async () => {
        if (
            selectedSymbols.length === 0 ||
            !walletAmount ||
            parseFloat(walletAmount) <= 0 ||
            selectedIndicators.length === 0 ||
            !selectedTimeframe
        ) {
            setError(
                "Please select at least one asset symbol, enter a positive wallet amount, select at least one indicator, and choose a timeframe.",
            );
            return;
        }

        setIsLoading(true);
        setError(null);

        const initialAnalyses: AssetAnalysis[] = selectedSymbols.map(
            (symbol) => ({
                symbol: symbol,
                isLoading: true,
                error: undefined,
                historicalData: [],
                analysisResult: null,
            }),
        );
        setAnalyses(initialAnalyses);

        try {
            const analysisPromises = selectedSymbols.map(
                async (symbol, index) => {
                    try {
                        // Fetch historical data
                        const historicalData = await fetchHistoricalData(
                            symbol.symbol,
                            selectedTimeframe,
                            dates.startDate,
                            dates.endDate,
                        );

                        // Always update with historical data, even if it's mock data
                        setAnalyses((prev) =>
                            prev.map((a) =>
                                a.symbol.symbol === symbol.symbol
                                    ? { ...a, historicalData }
                                    : a,
                            ),
                        );

                        // Log data source for user awareness
                        const isLikelyMockData =
                            historicalData.length <= 200 &&
                            historicalData.some((d) => d.openInterest > 50000);
                        if (isLikelyMockData) {
                            console.log(
                                `Using simulated data for ${symbol.symbol} - markets may be closed or data unavailable`,
                            );
                        }

                        // Always proceed with analysis using available data (real or mock)
                        console.log(
                            `Analyzing ${symbol.symbol} with ${historicalData.length} data points`,
                        );

                        // Get news articles for the symbol
                        let newsArticles = [];
                        try {
                            const { generateSearchTerms } = await import(
                                "./services/geminiService.ts"
                            );
                            const { searchNews } = await import(
                                "./services/newsSearchService.ts"
                            );
                            // Generate search terms using Gemini
                            const searchTerms =
                                await generateSearchTerms(symbol.symbol);

                            // Search for news articles with timeframe context
                            newsArticles = await searchNews(
                                searchTerms,
                                selectedTimeframe,
                            );
                            console.log(
                                `Found ${newsArticles.length} news articles for ${symbol.symbol}`,
                            );
                        } catch (newsError) {
                            console.warn(
                                `Failed to fetch news for ${symbol}:`,
                                newsError,
                            );
                        }

                        const result = await getTradingPosition(
                            symbol.symbol,
                            parseFloat(walletAmount),
                            selectedIndicators,
                            historicalData,
                            newsArticles,
                            undefined, // openInterestAnalysis
                            false, // includeOptionsAnalysis
                            false, // includeCallOptions
                            false, // includePutOptions
                            selectedTimeframe,
                        );
                        const patterns = await analyzeChartPatterns(
                            symbol.symbol,
                            historicalData,
                            selectedIndicators,
                        );

                        setAnalyses((prev) =>
                            prev.map((a) =>
                                a.symbol.symbol === symbol.symbol
                                    ? {
                                          ...a,
                                          isLoading: false,
                                          analysisResult: result,
                                          patternDetails: patterns,
                                          error: undefined,
                                      }
                                    : a,
                            ),
                        );
                    } catch (err) {
                        console.error(`Analysis failed for ${symbol.symbol}:`, err);
                        const errorMessage =
                            err instanceof Error ? err.message : String(err);
                        setAnalyses((prev) =>
                            prev.map((a) =>
                                a.symbol.symbol === symbol.symbol
                                    ? {
                                          ...a,
                                          isLoading: false,
                                          error: `Analysis failed: ${errorMessage}`,
                                      }
                                    : a,
                            ),
                        );
                    }
                },
            );

            await Promise.all(analysisPromises);
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "An unknown error occurred during setup.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [
        selectedSymbols,
        walletAmount,
        selectedIndicators,
        selectedTimeframe,
        dates,
    ]);

    // ProFlow app callbacks
    const proFlowCallbacks = {
        setSelectedSymbols,
        setWalletAmount,
        setSelectedIndicators,
        setSelectedTimeframe: handleTimeframeChange,
        setSelectedMarketType: handleMarketTypeChange,
        setSelectedMarket: handleMarketChange,
        handleAnalyze
    };

    const handleChatbotInputUpdates = (updates: any) => {
        console.log('🤖 App.tsx: handleChatbotInputUpdates called with:', updates);
        console.log('🤖 App.tsx: Current selectedSymbols before update:', selectedSymbols);
        console.log('🤖 App.tsx: Current selectedSymbols length:', selectedSymbols.length);
        console.log('🤖 App.tsx: Current selectedSymbols array:', selectedSymbols.map(s => ({ symbol: s.symbol, name: s.name })));

        // Handle addSymbols first and separately
        if (updates.addSymbols) {
            console.log('🤖 App.tsx: Processing addSymbols:', updates.addSymbols);
            console.log('🤖 App.tsx: addSymbols is array:', Array.isArray(updates.addSymbols));
            console.log('🤖 App.tsx: addSymbols length:', updates.addSymbols.length);
            console.log('🤖 App.tsx: About to call onAddSymbol for each symbol');

            // Add symbols one by one using the existing onAddSymbol function
            updates.addSymbols.forEach((symbolToAdd: any, index: number) => {
                console.log(`🤖 App.tsx: Processing symbol ${index + 1}/${updates.addSymbols.length}:`, symbolToAdd);
                console.log(`🤖 App.tsx: Symbol details:`, { symbol: symbolToAdd.symbol, name: symbolToAdd.name });
                console.log(`🤖 App.tsx: About to call onAddSymbol...`);

                onAddSymbol(symbolToAdd);

                console.log(`🤖 App.tsx: onAddSymbol called for symbol:`, symbolToAdd.symbol);

                // Check immediately after adding
                setTimeout(() => {
                    console.log(`🤖 App.tsx: Checking if ${symbolToAdd.symbol} was added...`);
                    const wasAdded = selectedSymbols.find(s => s.symbol === symbolToAdd.symbol);
                    if (wasAdded) {
                        console.log(`✅ App.tsx: Symbol ${symbolToAdd.symbol} successfully found in selectedSymbols`);
                    } else {
                        console.log(`❌ App.tsx: Symbol ${symbolToAdd.symbol} NOT found in selectedSymbols`);
                        console.log('❌ App.tsx: Current selectedSymbols after attempted add:', selectedSymbols.map(s => s.symbol));
                    }
                }, 50);
            });

            console.log('🤖 App.tsx: Finished processing all addSymbols');

            // Check overall state after all symbols processed
            setTimeout(() => {
                console.log('🤖 App.tsx: Final check - selectedSymbols after all additions:', selectedSymbols);
                console.log('🤖 App.tsx: Final selectedSymbols count:', selectedSymbols.length);
            }, 100);
        }

        // Handle market type changes using proper handlers
        if (updates.selectedMarketType !== undefined) {
            console.log('🤖 Setting market type to:', updates.selectedMarketType);
            handleMarketTypeChange(updates.selectedMarketType);
        }

        if (updates.selectedMarket !== undefined) {
            console.log('🤖 Setting market to:', updates.selectedMarket);
            handleMarketChange(updates.selectedMarket);
        }

        // Handle other updates
        if (updates.walletAmount !== undefined) {
            console.log('🤖 Setting wallet amount to:', updates.walletAmount);
            setWalletAmount(updates.walletAmount);
        }
        if (updates.selectedTimeframe !== undefined) {
            console.log('🤖 Setting timeframe to:', updates.selectedTimeframe);
            setSelectedTimeframe(updates.selectedTimeframe);
        }
        if (updates.selectedIndicators !== undefined) {
            console.log('🤖 Setting indicators to:', updates.selectedIndicators);
            setSelectedIndicators(updates.selectedIndicators);
        }
    };

    return (
        <div className="bg-background text-foreground min-h-screen p-4 sm:p-6 md:p-8 relative overflow-hidden">
            {/* Animated shooting streaks background */}
            <div className="shooting-streaks">
                <div className="streak streak-blue streak-1"></div>
                <div className="streak streak-purple streak-2"></div>
                <div className="streak streak-blue streak-3"></div>
                <div className="streak streak-purple streak-4"></div>
                <div className="streak streak-blue streak-5"></div>
                <div className="streak streak-purple streak-6"></div>
                <div className="streak streak-blue streak-7"></div>
                <div className="streak streak-purple streak-8"></div>
                <div className="streak streak-blue streak-9"></div>
                <div className="streak streak-purple streak-10"></div>
                <div className="streak streak-blue streak-11"></div>
                <div className="streak streak-purple streak-12"></div>
                <div className="streak streak-blue streak-13"></div>
                <div className="streak streak-purple streak-14"></div>
                <div className="streak streak-purple streak-15"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-8">
                 <Header 
                    theme={theme} 
                    onToggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    currentInputs={{
                        selectedSymbols: selectedSymbols.map(s => s.symbol),
                        walletAmount,
                        selectedIndicators,
                        selectedNonTechnicalIndicators,
                        selectedTimeframe,
                        selectedMarketType,
                        includeOptionsAnalysis,
                        includeCallOptions,
                        includePutOptions,
                        includeOrderAnalysis,
                        startDate: dates.startDate,
                        endDate: dates.endDate
                    }}
                    analysisResults={analyses}
                    profitMaxResult={profitMaxResult}
                    proFlowStatus={proFlowStatus}
                    onUpdateInputs={handleChatbotInputUpdates}
                />

                {/* ProFlow Controls */}
                <ProFlowControls
                    onShowToast={handleShowToast}
                    appCallbacks={proFlowCallbacks}
                />

                {/* Debug Toggle Button */}
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => setShowDebugPage(!showDebugPage)}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                    >
                        {showDebugPage ? '📊 Back to App' : '🔧 Debug Console'}
                    </button>
                </div>
                {showDebugPage ? (
                    <>
                        <DebugPage />
                    </>
                ) : (
                    <>
                        <main className="flex flex-col gap-3">
                            <div className="glass-effect p-6 sm:p-8 rounded-2xl shadow-2xl border-border backdrop-blur-xl card-glow sharp-corners relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/10 dark:to-transparent"></div>
                                <div className="relative z-10">
                                    <InputSection
                                        selectedSymbols={selectedSymbols}
                                        onAddSymbol={onAddSymbol}
                                        onRemoveSymbol={onRemoveSymbol}
                                        walletAmount={walletAmount}
                                        setWalletAmount={setWalletAmount}
                                        startDate={dates.startDate}
                                        setStartDate={(d) =>
                                            setDates((prev) => ({
                                                ...prev,
                                                startDate: d,
                                            }))
                                        }
                                        endDate={dates.endDate}
                                        setEndDate={(d) =>
                                            setDates((prev) => ({
                                                ...prev,
                                                endDate: d,
                                            }))
                                        }
                                        selectedIndicators={selectedIndicators}
                                        setSelectedIndicators={setSelectedIndicators}
                                        indicatorOptions={INDICATOR_OPTIONS}
                                        selectedNonTechnicalIndicators={
                                            selectedNonTechnicalIndicators
                                        }
                                        setSelectedNonTechnicalIndicators={
                                            setSelectedNonTechnicalIndicators
                                        }
                                        nonTechnicalIndicatorOptions={
                                            NON_TECHNICAL_INDICATOR_OPTIONS
                                        }
                                        selectedTimeframe={selectedTimeframe}
                                        setSelectedTimeframe={handleTimeframeChange}
                                        timeframeOptions={TIMEFRAME_OPTIONS}

                                        // --- KEY CHANGES HERE ---
                                        selectedMarketType={selectedMarketType}
                                        setSelectedMarketType={handleMarketTypeChange} // Use the new handler
                                        selectedMarket={selectedMarket}
                                        setSelectedMarket={handleMarketChange}       // Use the new handler
                                        marketOptions={
                                            MARKET_OPTIONS[selectedMarketType] || []
                                        }

                                        // The rest of the props
                                        includeOptionsAnalysis={includeOptionsAnalysis}
                                        setIncludeOptionsAnalysis={
                                            setIncludeOptionsAnalysis
                                        }
                                        includeCallOptions={includeCallOptions}
                                        setIncludeCallOptions={setIncludeCallOptions}
                                        includePutOptions={includePutOptions}
                                        setIncludePutOptions={setIncludePutOptions}
                                        includeOrderAnalysis={includeOrderAnalysis}
                                        setIncludeOrderAnalysis={
                                            setIncludeOrderAnalysis
                                        }
                                        onAnalyze={handleAnalyze}
                                        isLoading={isLoading}
                                        onProfitMaxClick={() => setIsProfitMaxModalOpen(true)}
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

                        {/* Symbol Addition Debugger */}
                        <SymbolDebugger
                            selectedSymbols={selectedSymbols}
                            currentMarketType={selectedMarketType}
                            currentMarket={selectedMarket}
                            onAddSymbol={onAddSymbol}
                            onRemoveSymbol={onRemoveSymbol}
                        />
                    </>
                )}
            </div>

            {/* ProfitMax Modals */}
            <ProfitMaxModal
                isOpen={isProfitMaxModalOpen}
                onClose={() => setIsProfitMaxModalOpen(false)}
                onOptimizationComplete={handleProfitMaxOptimization}
                currentMarketType={selectedMarketType}
                currentMarket={selectedMarket}
                currentIndicators={selectedIndicators}
                currentWalletAmount={walletAmount}
            />

            <ProfitMaxResultsModal
                isOpen={isProfitMaxResultsModalOpen}
                onClose={() => setIsProfitMaxResultsModalOpen(false)}
                onApplyResults={handleApplyProfitMaxResults}
                result={profitMaxResult}
            />

            {/* ProFlow Toast Notifications */}
            <ProFlowToastContainer
                toasts={proFlowToasts}
                onRemoveToast={handleRemoveToast}
            />
        </div>
    );
}

export default App;