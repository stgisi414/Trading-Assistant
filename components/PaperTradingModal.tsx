import React, { useState, useEffect } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Plus,
  Trash2,
  Eye,
  RefreshCw,
  Search,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  PaperTrade,
  PaperTradingPortfolio,
  OptionsChain,
  FmpSearchResult,
} from "../types";
import { paperTradingService } from "../services/paperTradingService";
import { symbolValidationService } from "../services/symbolValidationService";

interface MarketHours {
  exchange: string;
  name: string;
  openingHour: string;
  closingHour: string;
  timezone: string;
  isMarketOpen: boolean;
}

interface PaperTradingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaperTradingModal: React.FC<PaperTradingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "positions" | "orders" | "history"
  >("dashboard");
  const [portfolio, setPortfolio] = useState<PaperTradingPortfolio | null>(
    null,
  );
  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewTradeForm, setShowNewTradeForm] = useState(false);
  const [newTrade, setNewTrade] = useState({
    symbol: "",
    action: "BUY" as "BUY" | "SELL",
    quantity: 0,
    orderType: "MARKET" as "MARKET" | "LIMIT",
    limitPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    reasoning: "",
    // Options fields
    isOptions: false,
    optionType: "CALL" as "CALL" | "PUT",
    strikePrice: 0,
    expirationDate: "",
  });
  const [availableStrikes, setAvailableStrikes] = useState<number[]>([]);
  const [availableExpirations, setAvailableExpirations] = useState<Date[]>([]);
  const [showPortfolioSummary, setShowPortfolioSummary] = useState(false);
  const [loadingOptionsChain, setLoadingOptionsChain] = useState(false);
  const [marketHours, setMarketHours] = useState<MarketHours | null>(null);

  // Symbol search and validation
  const [symbolQuery, setSymbolQuery] = useState("");
  const [symbolSuggestions, setSymbolSuggestions] = useState<FmpSearchResult[]>(
    [],
  );
  const [selectedSymbol, setSelectedSymbol] = useState<FmpSearchResult | null>(
    null,
  );
  const [isSymbolValid, setIsSymbolValid] = useState(false);
  const [symbolValidationLoading, setSymbolValidationLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadPortfolioData();
    }
  }, [isOpen, user]);

  const fetchMarketHours = async () => {
    const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY || process.env.FMP_API_KEY;
    const exchange = portfolio?.positions[0]?.exchange || 'NYSE'; // Default to NYSE if no positions

    if (!FMP_API_KEY) {
      console.warn("FMP API key not available. Using estimated market hours.");
      // Fallback to estimated market status if no API key
      const now = new Date();
      const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const currentHour = estTime.getHours();
      const marketOpen = 9;
      const marketClose = 16;
      const isWeekday = estTime.getDay() >= 1 && estTime.getDay() <= 5;

      setMarketHours({
        exchange: "NASDAQ/NYSE",
        name: "US Markets (Estimated)",
        openingHour: "09:30 AM",
        closingHour: "04:00 PM",
        timezone: "America/New_York",
        isMarketOpen: isWeekday && currentHour >= marketOpen && currentHour < marketClose
      });
      return;
    }

    try {
      const response = await fetch(`https://financialmodelingprep.com/api/v3/market-hours/${exchange}?apikey=${FMP_API_KEY}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setMarketHours(data[0]);
        } else {
          // If API returns empty array, use fallback
          fetchMarketHours();
        }
      } else {
        // If API call fails, use fallback
        console.warn(`Failed to fetch market hours for ${exchange}, using fallback.`);
        fetchMarketHours();
      }
    } catch (error) {
      console.error('Error fetching market hours:', error);
      fetchMarketHours(); // Use fallback on any error
    }
  };

  const loadPortfolioData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [portfolioData, tradesData] = await Promise.all([
        paperTradingService.getPortfolio(),
        paperTradingService.getTrades(),
      ]);
      setPortfolio(portfolioData);
      setTrades(tradesData);
      await fetchMarketHours();
    } catch (error) {
      console.error("Error loading portfolio data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchSymbols = async (query: string) => {
    if (!query || query.trim().length < 1) {
      setSymbolSuggestions([]);
      return;
    }

    try {
      const suggestions = await symbolValidationService.searchSymbols(query, 5);
      setSymbolSuggestions(suggestions);
    } catch (error) {
      console.error("Error searching symbols:", error);
      setSymbolSuggestions([]);
    }
  };

  const validateSelectedSymbol = async (symbol: string) => {
    if (!symbol) {
      setIsSymbolValid(false);
      setSelectedSymbol(null);
      return;
    }

    setSymbolValidationLoading(true);
    try {
      const validSymbol = await symbolValidationService.validateSymbol(symbol);
      if (validSymbol) {
        setSelectedSymbol(validSymbol);
        setIsSymbolValid(true);
        setNewTrade((prev) => ({ ...prev, symbol: validSymbol.symbol }));
      } else {
        setSelectedSymbol(null);
        setIsSymbolValid(false);
      }
    } catch (error) {
      console.error("Error validating symbol:", error);
      setSelectedSymbol(null);
      setIsSymbolValid(false);
    } finally {
      setSymbolValidationLoading(false);
    }
  };

  const handleSymbolSelect = (symbol: FmpSearchResult) => {
    setSelectedSymbol(symbol);
    setSymbolQuery(symbol.symbol);
    setNewTrade((prev) => ({ ...prev, symbol: symbol.symbol }));
    setSymbolSuggestions([]);
    setIsSymbolValid(true);

    // Load options chain if needed
    if (newTrade.isOptions) {
      loadOptionsChain(symbol.symbol);
    }
  };

  const loadOptionsChain = async (symbol: string) => {
    if (!symbol || !newTrade.isOptions) return;

    setLoadingOptionsChain(true);
    try {
      const chains = await paperTradingService.getOptionsChain(symbol);
      if (chains.length > 0) {
        const strikes = chains[0].calls
          .map((c) => c.strike)
          .sort((a, b) => a - b);
        const expirations = chains
          .map((c) => c.expirationDate)
          .sort((a, b) => a.getTime() - b.getTime());
        setAvailableStrikes(strikes);
        setAvailableExpirations(expirations);

        // Set default values only if not already set
        if (strikes.length > 0 && newTrade.strikePrice === 0) {
          setNewTrade((prev) => ({
            ...prev,
            strikePrice: strikes[Math.floor(strikes.length / 2)],
          }));
        }
        if (expirations.length > 0 && !newTrade.expirationDate) {
          setNewTrade((prev) => ({
            ...prev,
            expirationDate: expirations[0].toISOString().split("T")[0],
          }));
        }
      } else {
        // No options available for this symbol
        setAvailableStrikes([]);
        setAvailableExpirations([]);
        setNewTrade((prev) => ({
          ...prev,
          strikePrice: 0,
          expirationDate: "",
        }));
      }
    } catch (error) {
      console.error("Error loading options chain:", error);
      setAvailableStrikes([]);
      setAvailableExpirations([]);
    } finally {
      setLoadingOptionsChain(false);
    }
  };

  // Debounced symbol search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (symbolQuery) {
        searchSymbols(symbolQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [symbolQuery]);

  // Load options chain when options toggle is changed or symbol is selected
  useEffect(() => {
    if (newTrade.isOptions && selectedSymbol) {
      loadOptionsChain(selectedSymbol.symbol);
    } else if (!newTrade.isOptions) {
      // Clear options data when switching to stocks
      setAvailableStrikes([]);
      setAvailableExpirations([]);
      setNewTrade((prev) => ({
        ...prev,
        strikePrice: 0,
        expirationDate: "",
        optionType: "CALL",
      }));
    }
  }, [newTrade.isOptions, selectedSymbol]);

  const handlePlaceTrade = async () => {
    if (!user || !newTrade.symbol || newTrade.quantity <= 0) {
      alert("Please enter a valid symbol and quantity");
      return;
    }

    if (!isSymbolValid || !selectedSymbol) {
      alert("Please select a valid symbol from the suggestions");
      return;
    }

    if (
      newTrade.isOptions &&
      (!newTrade.strikePrice || !newTrade.expirationDate)
    ) {
      alert(
        "Please select strike price and expiration date for options trades",
      );
      return;
    }

    // Check if option has already expired
    if (newTrade.isOptions && newTrade.expirationDate) {
      const expDate = new Date(newTrade.expirationDate);
      const today = new Date();
      if (expDate <= today) {
        alert(
          "Cannot trade expired options. Please select a future expiration date.",
        );
        return;
      }
    }

    try {
      setIsLoading(true);
      await paperTradingService.placeTrade({
        symbol: newTrade.symbol.toUpperCase(),
        action: newTrade.action,
        quantity: newTrade.quantity,
        orderType: newTrade.orderType,
        limitPrice:
          newTrade.orderType === "LIMIT" ? newTrade.limitPrice : undefined,
        stopLoss: newTrade.stopLoss > 0 ? newTrade.stopLoss : undefined,
        takeProfit: newTrade.takeProfit > 0 ? newTrade.takeProfit : undefined,
        reasoning: newTrade.reasoning,
        // Options fields
        isOptions: newTrade.isOptions,
        optionType: newTrade.isOptions ? newTrade.optionType : undefined,
        strikePrice: newTrade.isOptions ? newTrade.strikePrice : undefined,
        expirationDate: newTrade.isOptions
          ? new Date(newTrade.expirationDate)
          : undefined,
      });

      // Reset form and reload data
      setNewTrade({
        symbol: "",
        action: "BUY",
        quantity: 0,
        orderType: "MARKET",
        limitPrice: 0,
        stopLoss: 0,
        takeProfit: 0,
        reasoning: "",
        isOptions: false,
        optionType: "CALL",
        strikePrice: 0,
        expirationDate: "",
      });
      setAvailableStrikes([]);
      setAvailableExpirations([]);
      setSymbolQuery("");
      setSymbolSuggestions([]);
      setSelectedSymbol(null);
      setIsSymbolValid(false);
      setShowNewTradeForm(false);
      await loadPortfolioData();
    } catch (error) {
      console.error("Error placing trade:", error);
      alert("Error placing trade: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseTrade = async (tradeId: string) => {
    try {
      setIsLoading(true);
      await paperTradingService.closeTrade(tradeId);
      await loadPortfolioData();
    } catch (error) {
      console.error("Error closing trade:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPortfolio = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset your paper trading portfolio? This will delete all trades and positions and reset your balance to $100,000. This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);
      await paperTradingService.resetPortfolio();
      await loadPortfolioData();
      alert("Portfolio has been reset successfully!");
    } catch (error) {
      console.error("Error resetting portfolio:", error);
      alert("Error resetting portfolio: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  if (!isOpen) return null;

  const activeTrades = trades.filter((t) => t.status === "active");
  const closedTrades = trades.filter((t) => t.status === "closed");
  const totalPnL = portfolio?.totalValue
    ? portfolio.totalValue - portfolio.initialBalance
    : 0;
  const totalPnLPercent = portfolio?.initialBalance
    ? (totalPnL / portfolio.initialBalance) * 100
    : 0;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Paper Trading
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Practice trading with virtual money
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Portfolio Summary */}
        {portfolio && (
          <div className="border-b border-gray-200 dark:border-gray-700">
            {/* Mobile Toggle Button */}
            <div className="md:hidden p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowPortfolioSummary(!showPortfolioSummary)}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Portfolio Summary
                    </h3>
                    {/* Market Status Display */}
                    {marketHours && (
                      <div className={`border rounded-lg p-4 mb-6 ${
                        marketHours.isMarketOpen 
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {marketHours.isMarketOpen ? (
                              <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-sm font-medium mb-1 ${
                              marketHours.isMarketOpen 
                                ? "text-green-800 dark:text-green-200"
                                : "text-red-800 dark:text-red-200"
                            }`}>
                              {marketHours.isMarketOpen ? "Market Open" : "Market Closed"}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                              <p className={`${
                                marketHours.isMarketOpen 
                                  ? "text-green-700 dark:text-green-300"
                                  : "text-red-700 dark:text-red-300"
                              }`}>
                                <strong>{marketHours.name}</strong> ({marketHours.exchange})
                              </p>
                              <p className={`${
                                marketHours.isMarketOpen 
                                  ? "text-green-700 dark:text-green-300"
                                  : "text-red-700 dark:text-red-300"
                              }`}>
                                📅 Trading Hours: {marketHours.openingHour} - {marketHours.closingHour}
                              </p>
                            </div>
                            <p className={`text-xs mt-1 ${
                              marketHours.isMarketOpen 
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}>
                              🌍 {marketHours.timezone}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(portfolio.totalValue)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-sm font-medium ${totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatPercentage(totalPnLPercent)}
                  </span>
                  <div
                    className={`transition-transform duration-200 ${showPortfolioSummary ? "rotate-180" : ""}`}
                  >
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            </div>

            {/* Portfolio Details */}
            <div
              className={`p-6 ${showPortfolioSummary ? "block" : "hidden md:block"}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total Value
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(portfolio.totalValue)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Cash Balance
                      </p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(portfolio.cashBalance)}
                      </p>
                    </div>
                    <PieChart className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total P&L
                      </p>
                      <p
                        className={`text-xl font-bold ${totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatCurrency(totalPnL)}
                      </p>
                    </div>
                    {totalPnL >= 0 ? (
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    ) : (
                      <TrendingDown className="w-8 h-8 text-red-600" />
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Return %
                      </p>
                      <p
                        className={`text-xl font-bold ${totalPnLPercent >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatPercentage(totalPnLPercent)}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <div className="flex min-w-max">
            {[
              { id: "dashboard", label: "Dashboard", icon: PieChart },
              { id: "positions", label: "Active Positions", icon: TrendingUp },
              { id: "orders", label: "Place Order", icon: Plus },
              { id: "history", label: "Trade History", icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 md:px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">
                  {tab.id === "dashboard" && "Home"}
                  {tab.id === "positions" && "Positions"}
                  {tab.id === "orders" && "Order"}
                  {tab.id === "history" && "History"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Portfolio Overview
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleResetPortfolio}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                  <button
                    onClick={loadPortfolioData}
                    disabled={isLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                    />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {portfolio?.positions && portfolio.positions.length > 0 ? (
                <div className="grid gap-4">
                  {portfolio.positions.map((position, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {position.symbol}
                            </h4>
                            {position.isOptions && (
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  position.optionType === "CALL"
                                    ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                                    : "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                }`}
                              >
                                {position.optionType}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {position.quantity}{" "}
                            {position.isOptions ? "contracts" : "shares"} @{" "}
                            {formatCurrency(position.averagePrice)}
                          </p>
                          {position.isOptions && (
                            <p className="text-xs text-gray-400">
                              Strike: ${position.strikePrice} | Exp:{" "}
                              {position.expirationDate
                                ? new Date(
                                    position.expirationDate,
                                  ).toLocaleDateString()
                                : "N/A"}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-semibold ${position.unrealizedPnL >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatCurrency(position.unrealizedPnL)}
                          </p>
                          <p
                            className={`text-sm ${position.unrealizedPnLPercent >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {formatPercentage(position.unrealizedPnLPercent)}
                          </p>
                          {position.isOptions && position.delta && (
                            <p className="text-xs text-gray-400">
                              Δ: {position.delta.toFixed(3)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No positions yet. Place your first trade!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "positions" && (
            <div className="space-y-6">
              {/* Pending Orders Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Pending Orders
                </h3>
                {trades.filter((t) => t.status === "pending").length > 0 ? (
                  <div className="space-y-3">
                    {trades
                      .filter((t) => t.status === "pending")
                      .map((trade) => (
                        <div
                          key={trade.id}
                          className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {trade.symbol}
                                </span>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    trade.action === "BUY"
                                      ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                                      : "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                  }`}
                                >
                                  {trade.action}
                                </span>
                                <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
                                  PENDING
                                </span>
                                {trade.isOptions && (
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      trade.optionType === "CALL"
                                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                        : "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
                                    }`}
                                  >
                                    {trade.optionType}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                {trade.quantity}{" "}
                                {trade.isOptions ? "contracts" : "shares"} @
                                limit ${trade.limitPrice?.toFixed(2) || "N/A"}
                              </p>
                              {trade.isOptions && (
                                <p className="text-xs text-gray-400">
                                  Strike: ${trade.strikePrice} | Exp:{" "}
                                  {trade.expirationDate
                                    ? new Date(
                                        trade.expirationDate,
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </p>
                              )}
                              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                Waiting for{" "}
                                {trade.action === "BUY"
                                  ? "price to drop to"
                                  : "price to rise to"}{" "}
                                ${trade.limitPrice?.toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleCloseTrade(trade.id)}
                                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                              >
                                Cancel Order
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg
                        className="w-6 h-6 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      No pending limit orders
                    </p>
                  </div>
                )}
              </div>

              {/* Active Positions Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Active Positions
                </h3>
                {activeTrades.length > 0 ? (
                  <div className="space-y-4">
                    {activeTrades.map((trade) => (
                      <div
                        key={trade.id}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {trade.symbol}
                              </span>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  trade.action === "BUY"
                                    ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                                    : "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                                }`}
                              >
                                {trade.action}
                              </span>
                              {trade.isOptions && (
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    trade.optionType === "CALL"
                                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                      : "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
                                  }`}
                                >
                                  {trade.optionType}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {trade.quantity}{" "}
                              {trade.isOptions ? "contracts" : "shares"} @{" "}
                              {formatCurrency(trade.price)}
                            </p>
                            {trade.isOptions && (
                              <p className="text-xs text-gray-400">
                                Strike: ${trade.strikePrice} | Exp:{" "}
                                {trade.expirationDate
                                  ? new Date(
                                      trade.expirationDate,
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </p>
                            )}
                            {trade.reasoning && (
                              <p className="text-xs text-gray-400 mt-1">
                                {trade.reasoning}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleCloseTrade(trade.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                              Close Position
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No active positions
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Place New Order
              </h3>
             <div className="space-y-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Paper Trading Notice
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      This is a simulated trading environment using virtual money. 
                      All trades are for educational purposes only and use {portfolio?.positions.some(p => p.isOptions) || trades.some(t => t.isOptions) ? 'mock option prices calculated using Black-Scholes model and real stock prices from FMP API.' : 'real market prices from FMP API.'}
                    </p>
                  </div>
                </div>
              </div>

              {marketHours && (
                <div className={`border rounded-lg p-4 ${
                  marketHours.isMarketOpen 
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {marketHours.isMarketOpen ? (
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className={`text-sm font-medium mb-1 ${
                        marketHours.isMarketOpen 
                          ? "text-green-800 dark:text-green-200"
                          : "text-amber-800 dark:text-amber-200"
                      }`}>
                        {marketHours.isMarketOpen ? "Market Open" : "Market Closed"}
                      </h4>
                      <p className={`text-sm ${
                        marketHours.isMarketOpen 
                          ? "text-green-700 dark:text-green-300"
                          : "text-amber-700 dark:text-amber-300"
                      }`}>
                        <strong>{marketHours.name}</strong> ({marketHours.exchange})
                      </p>
                      <p className={`text-sm ${
                        marketHours.isMarketOpen 
                          ? "text-green-700 dark:text-green-300"
                          : "text-amber-700 dark:text-amber-300"
                      }`}>
                        📅 Trading Hours: {marketHours.openingHour} - {marketHours.closingHour}
                      </p>
                      <p className={`text-sm ${
                        marketHours.isMarketOpen 
                          ? "text-green-700 dark:text-green-300"
                          : "text-amber-700 dark:text-amber-300"
                      }`}>
                        🌍 Timezone: {marketHours.timezone}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
                {/* Trade Type Selection */}
                <div className="flex items-center space-x-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!newTrade.isOptions}
                      onChange={() =>
                        setNewTrade({ ...newTrade, isOptions: false })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Stocks
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={newTrade.isOptions}
                      onChange={() =>
                        setNewTrade({ ...newTrade, isOptions: true })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Options
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Symbol
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={symbolQuery}
                        onChange={(e) => {
                          const query = e.target.value.toUpperCase();
                          setSymbolQuery(query);
                          if (query !== selectedSymbol?.symbol) {
                            setIsSymbolValid(false);
                            setSelectedSymbol(null);
                          }
                        }}
                        onBlur={() => {
                          if (symbolQuery && !selectedSymbol) {
                            validateSelectedSymbol(symbolQuery);
                          }
                        }}
                        placeholder="e.g., AAPL"
                        className={`w-full px-3 py-2 pr-10 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                          isSymbolValid
                            ? "border-green-500 dark:border-green-400"
                            : selectedSymbol === null && symbolQuery
                              ? "border-red-500 dark:border-red-400"
                              : "border-gray-300 dark:border-gray-600"
                        }`}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {symbolValidationLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : isSymbolValid ? (
                          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        ) : (
                          <Search className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Symbol suggestions dropdown */}
                    {symbolSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {symbolSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSymbolSelect(suggestion)}
                            className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 first:rounded-t-lg last:rounded-b-lg"
                          >
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {suggestion.symbol}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {suggestion.name}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {suggestion.exchangeShortName}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedSymbol && (
                      <div className="mt-1 text-sm text-green-600 dark:text-green-400">
                        ✓ {selectedSymbol.symbol} - {selectedSymbol.name}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Action
                    </label>
                    <select
                      value={newTrade.action}
                      onChange={(e) =>
                        setNewTrade({
                          ...newTrade,
                          action: e.target.value as "BUY" | "SELL",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="BUY">Buy</option>
                      <option value="SELL">Sell</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={newTrade.quantity}
                      onChange={(e) =>
                        setNewTrade({
                          ...newTrade,
                          quantity: parseInt(e.target.value) || 0,
                        })
                      }
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Order Type
                    </label>
                    <select
                      value={newTrade.orderType}
                      onChange={(e) =>
                        setNewTrade({
                          ...newTrade,
                          orderType: e.target.value as "MARKET" | "LIMIT",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="MARKET">Market Order</option>
                      <option value="LIMIT">Limit Order</option>
                    </select>
                  </div>
                </div>

                {/* Options-specific fields */}
                {newTrade.isOptions && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Option Type
                      </label>
                      <select
                        value={newTrade.optionType}
                        onChange={(e) =>
                          setNewTrade({
                            ...newTrade,
                            optionType: e.target.value as "CALL" | "PUT",
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="CALL">Call</option>
                        <option value="PUT">Put</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Strike Price
                        {loadingOptionsChain && (
                          <span className="ml-2 text-xs text-blue-600">
                            Loading...
                          </span>
                        )}
                      </label>
                      <select
                        value={newTrade.strikePrice}
                        onChange={(e) =>
                          setNewTrade({
                            ...newTrade,
                            strikePrice: parseFloat(e.target.value),
                          })
                        }
                        disabled={
                          loadingOptionsChain || availableStrikes.length === 0
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                      >
                        <option value="">
                          {loadingOptionsChain
                            ? "Loading strikes..."
                            : availableStrikes.length === 0
                              ? "No strikes available"
                              : "Select Strike"}
                        </option>
                        {availableStrikes.map((strike) => (
                          <option key={strike} value={strike}>
                            ${strike.toFixed(2)}
                          </option>
                        ))}
                      </select>
                      {availableStrikes.length === 0 &&
                        !loadingOptionsChain &&
                        selectedSymbol && (
                          <p className="text-xs text-yellow-600 mt-1">
                            No options available for {selectedSymbol.symbol}
                          </p>
                        )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Expiration Date
                        {loadingOptionsChain && (
                          <span className="ml-2 text-xs text-blue-600">
                            Loading...
                          </span>
                        )}
                      </label>
                      <select
                        value={newTrade.expirationDate}
                        onChange={(e) =>
                          setNewTrade({
                            ...newTrade,
                            expirationDate: e.target.value,
                          })
                        }
                        disabled={
                          loadingOptionsChain ||
                          availableExpirations.length === 0
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                      >
                        <option value="">
                          {loadingOptionsChain
                            ? "Loading expirations..."
                            : availableExpirations.length === 0
                              ? "No expirations available"
                              : "Select Expiration"}
                        </option>
                        {availableExpirations.map((date) => {
                          const today = new Date();
                          const isExpiringSoon =
                            (date.getTime() - today.getTime()) /
                              (1000 * 60 * 60 * 24) <
                            7;
                          return (
                            <option
                              key={date.toISOString()}
                              value={date.toISOString().split("T")[0]}
                            >
                              {date.toLocaleDateString()}
                              {isExpiringSoon && " (Expires Soon)"}
                              {date <= today && " (EXPIRED)"}
                            </option>
                          );
                        })}
                      </select>
                      {availableExpirations.length === 0 &&
                        !loadingOptionsChain &&
                        selectedSymbol && (
                          <p className="text-xs text-yellow-600 mt-1">
                            No expiration dates available for{" "}
                            {selectedSymbol.symbol}
                          </p>
                        )}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                  <div className="space-y-1">
                    <p className="font-medium text-blue-800 dark:text-blue-300">
                      📚 Order Types Explained:
                    </p>
                    <p>
                      <strong>Market Order:</strong> Executes immediately at
                      current market price
                    </p>
                    <p>
                      <strong>Limit Order:</strong> Only executes when price
                      reaches your limit price or better
                    </p>
                    <p className="text-blue-600 dark:text-blue-400">
                      💡 For options, limit orders are recommended due to wide
                      bid-ask spreads!
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-medium text-blue-800 dark:text-blue-300">
                      🛡️ Risk Management:
                    </p>
                    <p>
                      <strong>Stop Loss:</strong> Automatically sells if price
                      drops to this level (limits losses)
                    </p>
                    <p>
                      <strong>Take Profit:</strong> Automatically sells if price
                      rises to this level (locks in gains)
                    </p>
                    <p className="text-green-600 dark:text-green-400">
                      ✅ These work independently and monitor your position 24/7
                    </p>
                  </div>

                  {newTrade.isOptions && (
                    <div className="space-y-1">
                      <p className="font-medium text-yellow-800 dark:text-yellow-300">
                        ⚠️ Options Trading:
                      </p>
                      <p>
                        Each contract = 100 shares. Quantity = number of
                        contracts.
                      </p>
                      <p>
                        Options expire automatically - ITM options settle at
                        intrinsic value.
                      </p>
                      {newTrade.expirationDate &&
                        (() => {
                          const expDate = new Date(newTrade.expirationDate);
                          const today = new Date();
                          const daysToExpiry = Math.ceil(
                            (expDate.getTime() - today.getTime()) /
                              (1000 * 60 * 60 * 24),
                          );

                          if (daysToExpiry <= 0) {
                            return (
                              <p className="text-red-600 font-medium">
                                ⚠️ This option has already expired!
                              </p>
                            );
                          } else if (daysToExpiry <= 7) {
                            return (
                              <p className="text-orange-600 font-medium">
                                ⚠️ This option expires in {daysToExpiry} day
                                {daysToExpiry !== 1 ? "s" : ""}!
                              </p>
                            );
                          }
                          return (
                            <p className="text-blue-600">
                              Option expires in {daysToExpiry} days
                            </p>
                          );
                        })()}
                    </div>
                  )}
                </div>

                {newTrade.orderType === "LIMIT" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Limit Price
                    </label>
                    <input
                      type="number"
                      value={newTrade.limitPrice}
                      onChange={(e) =>
                        setNewTrade({
                          ...newTrade,
                          limitPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Stop Loss (Optional)
                    </label>
                    <input
                      type="number"
                      value={newTrade.stopLoss}
                      onChange={(e) =>
                        setNewTrade({
                          ...newTrade,
                          stopLoss: parseFloat(e.target.value) || 0,
                        })
                      }
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Take Profit (Optional)
                    </label>
                    <input
                      type="number"
                      value={newTrade.takeProfit}
                      onChange={(e) =>
                        setNewTrade({
                          ...newTrade,
                          takeProfit: parseFloat(e.target.value) || 0,
                        })
                      }
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reasoning (Optional)
                  </label>
                  <textarea
                    value={newTrade.reasoning}
                    onChange={(e) =>
                      setNewTrade({ ...newTrade, reasoning: e.target.value })
                    }
                    placeholder="Why are you making this trade?"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <button
                  onClick={handlePlaceTrade}
                  disabled={
                    isLoading ||
                    !isSymbolValid ||
                    !selectedSymbol ||
                    newTrade.quantity <= 0
                  }
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Placing Order..." : "Place Order"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Trade History
              </h3>
              {closedTrades.length > 0 ? (
                <div className="space-y-4">
                  {closedTrades.map((trade) => (
                    <div
                      key={trade.id}
                      className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {trade.symbol}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                trade.action === "BUY"
                                  ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                                  : "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                              }`}
                            >
                              {trade.action}
                            </span>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                              CLOSED
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {trade.quantity} shares @{" "}
                            {formatCurrency(trade.price)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(trade.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {trade.realizedPnL !== undefined && (
                            <p
                              className={`font-semibold ${trade.realizedPnL >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {formatCurrency(trade.realizedPnL)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No trade history yet
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};