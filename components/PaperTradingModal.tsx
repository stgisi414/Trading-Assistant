
import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Plus, Trash2, Eye, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PaperTrade, PaperTradingPortfolio, OptionsChain } from '../types';
import { paperTradingService } from '../services/paperTradingService';

interface PaperTradingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaperTradingModal: React.FC<PaperTradingModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'positions' | 'orders' | 'history'>('dashboard');
  const [portfolio, setPortfolio] = useState<PaperTradingPortfolio | null>(null);
  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewTradeForm, setShowNewTradeForm] = useState(false);
  const [newTrade, setNewTrade] = useState({
    symbol: '',
    action: 'BUY' as 'BUY' | 'SELL',
    quantity: 0,
    orderType: 'MARKET' as 'MARKET' | 'LIMIT',
    limitPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    reasoning: '',
    // Options fields
    isOptions: false,
    optionType: 'CALL' as 'CALL' | 'PUT',
    strikePrice: 0,
    expirationDate: ''
  });
  const [availableStrikes, setAvailableStrikes] = useState<number[]>([]);
  const [availableExpirations, setAvailableExpirations] = useState<Date[]>([]);
  const [showPortfolioSummary, setShowPortfolioSummary] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadPortfolioData();
    }
  }, [isOpen, user]);

  const loadPortfolioData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const [portfolioData, tradesData] = await Promise.all([
        paperTradingService.getPortfolio(),
        paperTradingService.getTrades()
      ]);
      setPortfolio(portfolioData);
      setTrades(tradesData);
    } catch (error) {
      console.error('Error loading portfolio data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOptionsChain = async (symbol: string) => {
    if (!symbol || !newTrade.isOptions) return;
    
    try {
      const chains = await paperTradingService.getOptionsChain(symbol);
      if (chains.length > 0) {
        const strikes = chains[0].calls.map(c => c.strike);
        const expirations = chains.map(c => c.expirationDate);
        setAvailableStrikes(strikes);
        setAvailableExpirations(expirations);
        
        // Set default values
        if (strikes.length > 0 && !newTrade.strikePrice) {
          setNewTrade(prev => ({ ...prev, strikePrice: strikes[Math.floor(strikes.length / 2)] }));
        }
        if (expirations.length > 0 && !newTrade.expirationDate) {
          setNewTrade(prev => ({ ...prev, expirationDate: expirations[0].toISOString().split('T')[0] }));
        }
      }
    } catch (error) {
      console.error('Error loading options chain:', error);
    }
  };

  const handlePlaceTrade = async () => {
    if (!user || !newTrade.symbol || newTrade.quantity <= 0) return;
    
    if (newTrade.isOptions && (!newTrade.strikePrice || !newTrade.expirationDate)) {
      alert('Please select strike price and expiration date for options trades');
      return;
    }

    try {
      setIsLoading(true);
      await paperTradingService.placeTrade({
        symbol: newTrade.symbol.toUpperCase(),
        action: newTrade.action,
        quantity: newTrade.quantity,
        orderType: newTrade.orderType,
        limitPrice: newTrade.orderType === 'LIMIT' ? newTrade.limitPrice : undefined,
        stopLoss: newTrade.stopLoss > 0 ? newTrade.stopLoss : undefined,
        takeProfit: newTrade.takeProfit > 0 ? newTrade.takeProfit : undefined,
        reasoning: newTrade.reasoning,
        // Options fields
        isOptions: newTrade.isOptions,
        optionType: newTrade.isOptions ? newTrade.optionType : undefined,
        strikePrice: newTrade.isOptions ? newTrade.strikePrice : undefined,
        expirationDate: newTrade.isOptions ? new Date(newTrade.expirationDate) : undefined
      });

      // Reset form and reload data
      setNewTrade({
        symbol: '',
        action: 'BUY',
        quantity: 0,
        orderType: 'MARKET',
        limitPrice: 0,
        stopLoss: 0,
        takeProfit: 0,
        reasoning: '',
        isOptions: false,
        optionType: 'CALL',
        strikePrice: 0,
        expirationDate: ''
      });
      setAvailableStrikes([]);
      setAvailableExpirations([]);
      setShowNewTradeForm(false);
      await loadPortfolioData();
    } catch (error) {
      console.error('Error placing trade:', error);
      alert('Error placing trade: ' + (error as Error).message);
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
      console.error('Error closing trade:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (!isOpen) return null;

  const activeTrades = trades.filter(t => t.status === 'active');
  const closedTrades = trades.filter(t => t.status === 'closed');
  const totalPnL = portfolio?.totalValue ? portfolio.totalValue - portfolio.initialBalance : 0;
  const totalPnLPercent = portfolio?.initialBalance ? (totalPnL / portfolio.initialBalance) * 100 : 0;

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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Paper Trading</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Practice trading with virtual money</p>
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Portfolio Summary</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(portfolio.totalValue)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(totalPnLPercent)}
                  </span>
                  <div className={`transition-transform duration-200 ${showPortfolioSummary ? 'rotate-180' : ''}`}>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>

            {/* Portfolio Details */}
            <div className={`p-6 ${showPortfolioSummary ? 'block' : 'hidden md:block'}`}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">Cash Balance</p>
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total P&L</p>
                      <p className={`text-xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">Return %</p>
                      <p className={`text-xl font-bold ${totalPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
              { id: 'dashboard', label: 'Dashboard', icon: PieChart },
              { id: 'positions', label: 'Active Positions', icon: TrendingUp },
              { id: 'orders', label: 'Place Order', icon: Plus },
              { id: 'history', label: 'Trade History', icon: BarChart3 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 md:px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">
                  {tab.id === 'dashboard' && 'Home'}
                  {tab.id === 'positions' && 'Positions'}
                  {tab.id === 'orders' && 'Order'}
                  {tab.id === 'history' && 'History'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Portfolio Overview</h3>
                <button
                  onClick={loadPortfolioData}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {portfolio?.positions && portfolio.positions.length > 0 ? (
                <div className="grid gap-4">
                  {portfolio.positions.map((position, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{position.symbol}</h4>
                            {position.isOptions && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                position.optionType === 'CALL' 
                                  ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
                                  : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                              }`}>
                                {position.optionType}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {position.quantity} {position.isOptions ? 'contracts' : 'shares'} @ {formatCurrency(position.averagePrice)}
                          </p>
                          {position.isOptions && (
                            <p className="text-xs text-gray-400">
                              Strike: ${position.strikePrice} | Exp: {position.expirationDate ? new Date(position.expirationDate).toLocaleDateString() : 'N/A'}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${position.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(position.unrealizedPnL)}
                          </p>
                          <p className={`text-sm ${position.unrealizedPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                  <p className="text-gray-500 dark:text-gray-400">No positions yet. Place your first trade!</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'positions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Positions</h3>
              {activeTrades.length > 0 ? (
                <div className="space-y-4">
                  {activeTrades.map(trade => (
                    <div key={trade.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900 dark:text-white">{trade.symbol}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              trade.action === 'BUY' 
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
                                : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {trade.action}
                            </span>
                            {trade.isOptions && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                trade.optionType === 'CALL' 
                                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                                  : 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                              }`}>
                                {trade.optionType}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {trade.quantity} {trade.isOptions ? 'contracts' : 'shares'} @ {formatCurrency(trade.price)}
                          </p>
                          {trade.isOptions && (
                            <p className="text-xs text-gray-400">
                              Strike: ${trade.strikePrice} | Exp: {trade.expirationDate ? new Date(trade.expirationDate).toLocaleDateString() : 'N/A'}
                            </p>
                          )}
                          {trade.reasoning && (
                            <p className="text-xs text-gray-400 mt-1">{trade.reasoning}</p>
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
                  <p className="text-gray-500 dark:text-gray-400">No active positions</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Place New Order</h3>
              
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
                {/* Trade Type Selection */}
                <div className="flex items-center space-x-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!newTrade.isOptions}
                      onChange={() => setNewTrade({...newTrade, isOptions: false})}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Stocks</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={newTrade.isOptions}
                      onChange={() => setNewTrade({...newTrade, isOptions: true})}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Options</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Symbol
                    </label>
                    <input
                      type="text"
                      value={newTrade.symbol}
                      onChange={(e) => {
                        const symbol = e.target.value.toUpperCase();
                        setNewTrade({...newTrade, symbol});
                        if (newTrade.isOptions) {
                          loadOptionsChain(symbol);
                        }
                      }}
                      placeholder="e.g., AAPL"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Action
                    </label>
                    <select
                      value={newTrade.action}
                      onChange={(e) => setNewTrade({...newTrade, action: e.target.value as 'BUY' | 'SELL'})}
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
                      onChange={(e) => setNewTrade({...newTrade, quantity: parseInt(e.target.value) || 0})}
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
                      onChange={(e) => setNewTrade({...newTrade, orderType: e.target.value as 'MARKET' | 'LIMIT'})}
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
                        onChange={(e) => setNewTrade({...newTrade, optionType: e.target.value as 'CALL' | 'PUT'})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="CALL">Call</option>
                        <option value="PUT">Put</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Strike Price
                      </label>
                      <select
                        value={newTrade.strikePrice}
                        onChange={(e) => setNewTrade({...newTrade, strikePrice: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select Strike</option>
                        {availableStrikes.map(strike => (
                          <option key={strike} value={strike}>${strike}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Expiration Date
                      </label>
                      <select
                        value={newTrade.expirationDate}
                        onChange={(e) => setNewTrade({...newTrade, expirationDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select Expiration</option>
                        {availableExpirations.map(date => (
                          <option key={date.toISOString()} value={date.toISOString().split('T')[0]}>
                            {date.toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {newTrade.isOptions && (
                    <p>Note: Each option contract represents 100 shares. Quantity refers to number of contracts.</p>
                  )}
                </div>

                {newTrade.orderType === 'LIMIT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Limit Price
                    </label>
                    <input
                      type="number"
                      value={newTrade.limitPrice}
                      onChange={(e) => setNewTrade({...newTrade, limitPrice: parseFloat(e.target.value) || 0})}
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
                      onChange={(e) => setNewTrade({...newTrade, stopLoss: parseFloat(e.target.value) || 0})}
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
                      onChange={(e) => setNewTrade({...newTrade, takeProfit: parseFloat(e.target.value) || 0})}
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
                    onChange={(e) => setNewTrade({...newTrade, reasoning: e.target.value})}
                    placeholder="Why are you making this trade?"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <button
                  onClick={handlePlaceTrade}
                  disabled={isLoading || !newTrade.symbol || newTrade.quantity <= 0}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trade History</h3>
              {closedTrades.length > 0 ? (
                <div className="space-y-4">
                  {closedTrades.map(trade => (
                    <div key={trade.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900 dark:text-white">{trade.symbol}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              trade.action === 'BUY' 
                                ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' 
                                : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {trade.action}
                            </span>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                              CLOSED
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {trade.quantity} shares @ {formatCurrency(trade.price)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(trade.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          {trade.realizedPnL !== undefined && (
                            <p className={`font-semibold ${trade.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                  <p className="text-gray-500 dark:text-gray-400">No trade history yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
