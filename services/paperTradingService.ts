
import { firebaseService } from './firebaseService';
import { PaperTrade, PaperTradingPortfolio, MarketData } from '../types';

class PaperTradingService {
  private static instance: PaperTradingService;

  static getInstance(): PaperTradingService {
    if (!PaperTradingService.instance) {
      PaperTradingService.instance = new PaperTradingService();
    }
    return PaperTradingService.instance;
  }

  // Get current market price for a symbol (mock implementation)
  private async getMarketPrice(symbol: string): Promise<number> {
    try {
      // In a real implementation, you would fetch from a market data API
      // For now, we'll simulate market prices
      const mockPrices: { [key: string]: number } = {
        'AAPL': 175.50,
        'GOOGL': 2800.25,
        'MSFT': 375.80,
        'TSLA': 245.90,
        'AMZN': 3200.15,
        'NVDA': 450.30,
        'META': 320.75,
        'NFLX': 425.60,
        'AMD': 105.40,
        'INTC': 45.20
      };

      // Add some random variation to simulate market movement
      const basePrice = mockPrices[symbol] || 100;
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      return basePrice * (1 + variation);
    } catch (error) {
      console.error('Error fetching market price:', error);
      return 100; // Default price
    }
  }

  // Initialize user's paper trading portfolio
  async initializePortfolio(): Promise<PaperTradingPortfolio> {
    const initialBalance = 100000; // $100,000 starting balance
    
    const portfolio: PaperTradingPortfolio = {
      userId: firebaseService.getCurrentUser()?.uid || '',
      initialBalance,
      cashBalance: initialBalance,
      totalValue: initialBalance,
      positions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await firebaseService.savePaperTradingPortfolio(portfolio);
    return portfolio;
  }

  // Get user's portfolio
  async getPortfolio(): Promise<PaperTradingPortfolio> {
    try {
      const portfolio = await firebaseService.loadPaperTradingPortfolio();
      if (!portfolio) {
        return await this.initializePortfolio();
      }

      // Update positions with current market prices
      const updatedPositions = await Promise.all(
        portfolio.positions.map(async (position) => {
          const currentPrice = await this.getMarketPrice(position.symbol);
          const marketValue = currentPrice * position.quantity;
          const unrealizedPnL = marketValue - (position.averagePrice * position.quantity);
          const unrealizedPnLPercent = (unrealizedPnL / (position.averagePrice * position.quantity)) * 100;

          return {
            ...position,
            currentPrice,
            marketValue,
            unrealizedPnL,
            unrealizedPnLPercent
          };
        })
      );

      const totalPositionValue = updatedPositions.reduce((sum, pos) => sum + pos.marketValue, 0);
      const updatedPortfolio: PaperTradingPortfolio = {
        ...portfolio,
        positions: updatedPositions,
        totalValue: portfolio.cashBalance + totalPositionValue,
        updatedAt: new Date()
      };

      // Save updated portfolio
      await firebaseService.savePaperTradingPortfolio(updatedPortfolio);
      return updatedPortfolio;
    } catch (error) {
      console.error('Error getting portfolio:', error);
      return await this.initializePortfolio();
    }
  }

  // Place a new trade
  async placeTrade(tradeRequest: {
    symbol: string;
    action: 'BUY' | 'SELL';
    quantity: number;
    orderType: 'MARKET' | 'LIMIT';
    limitPrice?: number;
    stopLoss?: number;
    takeProfit?: number;
    reasoning?: string;
  }): Promise<string> {
    const portfolio = await this.getPortfolio();
    
    // Get current market price
    const marketPrice = tradeRequest.orderType === 'LIMIT' && tradeRequest.limitPrice 
      ? tradeRequest.limitPrice 
      : await this.getMarketPrice(tradeRequest.symbol);

    const totalCost = marketPrice * tradeRequest.quantity;
    
    // Validate trade
    if (tradeRequest.action === 'BUY' && totalCost > portfolio.cashBalance) {
      throw new Error('Insufficient cash balance');
    }

    if (tradeRequest.action === 'SELL') {
      const existingPosition = portfolio.positions.find(p => p.symbol === tradeRequest.symbol);
      if (!existingPosition || existingPosition.quantity < tradeRequest.quantity) {
        throw new Error('Insufficient shares to sell');
      }
    }

    // Create trade record
    const trade: PaperTrade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: portfolio.userId,
      symbol: tradeRequest.symbol,
      action: tradeRequest.action,
      quantity: tradeRequest.quantity,
      price: marketPrice,
      orderType: tradeRequest.orderType,
      limitPrice: tradeRequest.limitPrice,
      stopLoss: tradeRequest.stopLoss,
      takeProfit: tradeRequest.takeProfit,
      reasoning: tradeRequest.reasoning,
      timestamp: new Date(),
      status: 'active'
    };

    // Update portfolio
    const updatedPortfolio = { ...portfolio };
    
    if (tradeRequest.action === 'BUY') {
      // Reduce cash balance
      updatedPortfolio.cashBalance -= totalCost;
      
      // Add or update position
      const existingPositionIndex = updatedPortfolio.positions.findIndex(p => p.symbol === tradeRequest.symbol);
      if (existingPositionIndex >= 0) {
        const existingPosition = updatedPortfolio.positions[existingPositionIndex];
        const totalShares = existingPosition.quantity + tradeRequest.quantity;
        const totalCost = (existingPosition.averagePrice * existingPosition.quantity) + (marketPrice * tradeRequest.quantity);
        
        updatedPortfolio.positions[existingPositionIndex] = {
          ...existingPosition,
          quantity: totalShares,
          averagePrice: totalCost / totalShares,
          marketValue: marketPrice * totalShares,
          unrealizedPnL: (marketPrice * totalShares) - totalCost,
          unrealizedPnLPercent: ((marketPrice * totalShares) - totalCost) / totalCost * 100
        };
      } else {
        updatedPortfolio.positions.push({
          symbol: tradeRequest.symbol,
          quantity: tradeRequest.quantity,
          averagePrice: marketPrice,
          currentPrice: marketPrice,
          marketValue: totalCost,
          unrealizedPnL: 0,
          unrealizedPnLPercent: 0
        });
      }
    } else { // SELL
      // Add to cash balance
      updatedPortfolio.cashBalance += totalCost;
      
      // Update position
      const existingPositionIndex = updatedPortfolio.positions.findIndex(p => p.symbol === tradeRequest.symbol);
      if (existingPositionIndex >= 0) {
        const existingPosition = updatedPortfolio.positions[existingPositionIndex];
        const newQuantity = existingPosition.quantity - tradeRequest.quantity;
        
        if (newQuantity === 0) {
          // Remove position entirely
          updatedPortfolio.positions.splice(existingPositionIndex, 1);
        } else {
          // Update position quantity
          updatedPortfolio.positions[existingPositionIndex] = {
            ...existingPosition,
            quantity: newQuantity,
            marketValue: marketPrice * newQuantity,
            unrealizedPnL: (marketPrice * newQuantity) - (existingPosition.averagePrice * newQuantity),
            unrealizedPnLPercent: ((marketPrice * newQuantity) - (existingPosition.averagePrice * newQuantity)) / (existingPosition.averagePrice * newQuantity) * 100
          };
        }
        
        // Calculate realized P&L for the sold shares
        const realizedPnL = (marketPrice - existingPosition.averagePrice) * tradeRequest.quantity;
        trade.realizedPnL = realizedPnL;
      }
    }

    // Recalculate total portfolio value
    const totalPositionValue = updatedPortfolio.positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    updatedPortfolio.totalValue = updatedPortfolio.cashBalance + totalPositionValue;
    updatedPortfolio.updatedAt = new Date();

    // Save trade and portfolio
    await Promise.all([
      firebaseService.savePaperTrade(trade),
      firebaseService.savePaperTradingPortfolio(updatedPortfolio)
    ]);

    return trade.id;
  }

  // Close a trade (for active positions)
  async closeTrade(tradeId: string): Promise<void> {
    const trade = await firebaseService.loadPaperTrade(tradeId);
    if (!trade || trade.status !== 'active') {
      throw new Error('Trade not found or already closed');
    }

    // Place opposite order to close the position
    const closeAction = trade.action === 'BUY' ? 'SELL' : 'BUY';
    
    await this.placeTrade({
      symbol: trade.symbol,
      action: closeAction,
      quantity: trade.quantity,
      orderType: 'MARKET',
      reasoning: `Closing position for trade ${tradeId}`
    });

    // Update original trade status
    const updatedTrade = {
      ...trade,
      status: 'closed' as const,
      closedAt: new Date()
    };

    await firebaseService.savePaperTrade(updatedTrade);
  }

  // Get all trades for the user
  async getTrades(): Promise<PaperTrade[]> {
    return await firebaseService.loadPaperTrades();
  }

  // Get trade by ID
  async getTrade(tradeId: string): Promise<PaperTrade | null> {
    return await firebaseService.loadPaperTrade(tradeId);
  }

  // Reset portfolio (for testing/demo purposes)
  async resetPortfolio(): Promise<PaperTradingPortfolio> {
    const user = firebaseService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Delete all existing trades and portfolio
    await firebaseService.deletePaperTradingData();
    
    // Create new portfolio
    return await this.initializePortfolio();
  }

  // Get portfolio performance metrics
  async getPerformanceMetrics(): Promise<{
    totalReturn: number;
    totalReturnPercent: number;
    winRate: number;
    totalTrades: number;
    profitableTrades: number;
    averageWin: number;
    averageLoss: number;
  }> {
    const [portfolio, trades] = await Promise.all([
      this.getPortfolio(),
      this.getTrades()
    ]);

    const closedTrades = trades.filter(t => t.status === 'closed' && t.realizedPnL !== undefined);
    const profitableTrades = closedTrades.filter(t => (t.realizedPnL || 0) > 0);
    const losingTrades = closedTrades.filter(t => (t.realizedPnL || 0) < 0);

    const totalReturn = portfolio.totalValue - portfolio.initialBalance;
    const totalReturnPercent = (totalReturn / portfolio.initialBalance) * 100;
    const winRate = closedTrades.length > 0 ? (profitableTrades.length / closedTrades.length) * 100 : 0;
    
    const averageWin = profitableTrades.length > 0 
      ? profitableTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0) / profitableTrades.length
      : 0;
    
    const averageLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.realizedPnL || 0), 0)) / losingTrades.length
      : 0;

    return {
      totalReturn,
      totalReturnPercent,
      winRate,
      totalTrades: closedTrades.length,
      profitableTrades: profitableTrades.length,
      averageWin,
      averageLoss
    };
  }
}

export const paperTradingService = PaperTradingService.getInstance();
