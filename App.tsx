import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Header } from "./components/Header.tsx";
import { InputSection } from "./components/InputSection.tsx";
import { ResultsSection } from "./components/ResultsSection.tsx";
import { ProfitMaxModal } from "./components/ProfitMaxModal.tsx";
import { ProfitMaxResultsModal } from "./components/ProfitMaxResultsModal.tsx";
import { getTradingPosition } from "./services/geminiService.ts";
import { fetchHistoricalData } from "./services/marketDataService.ts";
import { analyzeChartPatterns } from "./services/patternAnalysisService.ts";
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

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === "light" ? "dark" : "light");
        root.classList.add(theme);
    }, [theme]);

    // Save input data to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(
            "tradingApp_selectedSymbols",
            JSON.stringify(selectedSymbols),
        );
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

    const onAddSymbol = (symbol: FmpSearchResult) => {
        // Adds a symbol if it's not already in the list
        if (!selectedSymbols.find(s => s.symbol === symbol.symbol)) {
            setSelectedSymbols(prev => [...prev, symbol]);
        }
    };

    const onRemoveSymbol = (symbol: string) => {
        // Removes a symbol from the list
        setSelectedSymbols(prev => prev.filter(s => s.symbol !== symbol));
    };

    const toggleTheme = () => {
        setTheme((prev) => {
            const newTheme = prev === "light" ? "dark" : "light";
            localStorage.setItem("theme", newTheme);
            return newTheme;
        });
    };

    const handleMarketTypeChange = (newMarketType: string) => {
        setSelectedMarketType(newMarketType as MarketType); // Use your original setter
        const newMarket = MARKET_OPTIONS[newMarketType]?.[0]?.value || "";
        setSelectedMarket(newMarket); // Use your original setter
        setSelectedSymbols([]); 
    };

    const handleMarketChange = (newMarket: string) => {
        setSelectedMarket(newMarket); // Use your original setter
        setSelectedSymbols([]); 
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
        }
    };

    const currentMarketSymbols = useMemo(() => {
        // Depend on your original state variables
        if (!selectedMarketType || !selectedMarket) return []; 
        const marketData = MARKET_OPTIONS[selectedMarketType]?.find(m => m.value === selectedMarket);
        return marketData?.symbols?.map(s => s.symbol) || [];
    }, [selectedMarketType, selectedMarket]); // Update dependencies

      useEffect(() => {
        setSelectedSymbols(prevSymbols =>
          prevSymbols.filter(symbolObj => currentMarketSymbols.includes(symbolObj.symbol))
        );
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
                symbol,
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
                            symbol,
                            selectedTimeframe,
                            dates.startDate,
                            dates.endDate,
                        );

                        // Always update with historical data, even if it's mock data
                        setAnalyses((prev) =>
                            prev.map((a) =>
                                a.symbol === symbol
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
                                `Using simulated data for ${symbol} - markets may be closed or data unavailable`,
                            );
                        }

                        // Always proceed with analysis using available data (real or mock)
                        console.log(
                            `Analyzing ${symbol} with ${historicalData.length} data points`,
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
                                await generateSearchTerms(symbol);

                            // Search for news articles with timeframe context
                            newsArticles = await searchNews(
                                searchTerms,
                                selectedTimeframe,
                            );
                            console.log(
                                `Found ${newsArticles.length} news articles for ${symbol}`,
                            );
                        } catch (newsError) {
                            console.warn(
                                `Failed to fetch news for ${symbol}:`,
                                newsError,
                            );
                        }

                        const result = await getTradingPosition(
                            symbol,
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
                            symbol,
                            historicalData,
                            selectedIndicators,
                        );

                        setAnalyses((prev) =>
                            prev.map((a) =>
                                a.symbol === symbol
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
                        console.error(`Analysis failed for ${symbol}:`, err);
                        const errorMessage =
                            err instanceof Error ? err.message : String(err);
                        setAnalyses((prev) =>
                            prev.map((a) =>
                                a.symbol === symbol
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
                    toggleTheme={toggleTheme}
                    currentInputs={{
                        // This is the line you need to change:
                        selectedSymbols: selectedSymbols.map(s => s.symbol),

                        // The rest of the props remain the same
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
                        endDate: dates.endDate,
                    }}
                    analysisResults={analyses}
                />
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
                                setSelectedTimeframe={setSelectedTimeframe}
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
        </div>
    );
}

export default App;