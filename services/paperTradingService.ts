
import { firebaseService } from './firebaseService';
import { PaperTrade, PaperTradingPortfolio, MarketData, OptionsChain, OptionContract } from '../types';

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

  // Black-Scholes option pricing model (simplified)
  private calculateOptionPrice(
    stockPrice: number,
    strikePrice: number,
    timeToExpiry: number, // in years
    volatility: number = 0.25,
    riskFreeRate: number = 0.05,
    optionType: 'CALL' | 'PUT'
  ): { price: number; greeks: { delta: number; gamma: number; theta: number; vega: number } } {
    const d1 = (Math.log(stockPrice / strikePrice) + (riskFreeRate + (volatility ** 2) / 2) * timeToExpiry) / (volatility * Math.sqrt(timeToExpiry));
    const d2 = d1 - volatility * Math.sqrt(timeToExpiry);

    // Standard normal cumulative distribution function (approximation)
    const normCDF = (x: number): number => {
      const a1 = 0.31938153;
      const a2 = -0.356563782;
      const a3 = 1.781477937;
      const a4 = -1.821255978;
      const a5 = 1.330274429;
      const k = 1.0 / (1.0 + 0.2316419 * Math.abs(x));
      const w = 1.0 - (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x) * (a1 * k + a2 * k * k + a3 * Math.pow(k, 3) + a4 * Math.pow(k, 4) + a5 * Math.pow(k, 5));
      return x > 0 ? w : 1.0 - w;
    };

    const normPDF = (x: number): number => (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);

    let price: number;
    let delta: number;

    if (optionType === 'CALL') {
      price = stockPrice * normCDF(d1) - strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normCDF(d2);
      delta = normCDF(d1);
    } else {
      price = strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normCDF(-d2) - stockPrice * normCDF(-d1);
      delta = normCDF(d1) - 1;
    }

    // Greeks calculations
    const gamma = normPDF(d1) / (stockPrice * volatility * Math.sqrt(timeToExpiry));
    const theta = (-(stockPrice * normPDF(d1) * volatility) / (2 * Math.sqrt(timeToExpiry)) - 
                   riskFreeRate * strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * 
                   (optionType === 'CALL' ? normCDF(d2) : normCDF(-d2))) / 365;
    const vega = (stockPrice * normPDF(d1) * Math.sqrt(timeToExpiry)) / 100;

    return {
      price: Math.max(price, 0.01), // Minimum price of $0.01
      greeks: { delta, gamma, theta, vega }
    };
  }

  // Get option price for a specific contract
  private async getOptionPrice(
    symbol: string,
    optionType: 'CALL' | 'PUT',
    strikePrice: number,
    expirationDate: Date
  ): Promise<{ price: number; greeks: { delta: number; gamma: number; theta: number; vega: number } }> {
    const stockPrice = await this.getMarketPrice(symbol);
    const now = new Date();
    const timeToExpiry = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365); // in years

    if (timeToExpiry <= 0) {
      // Option has expired, calculate intrinsic value only
      const intrinsicValue = optionType === 'CALL' 
        ? Math.max(stockPrice - strikePrice, 0)
        : Math.max(strikePrice - stockPrice, 0);
      
      return {
        price: intrinsicValue,
        greeks: { delta: 0, gamma: 0, theta: 0, vega: 0 }
      };
    }

    return this.calculateOptionPrice(stockPrice, strikePrice, timeToExpiry, 0.25, 0.05, optionType);
  }

  // Get available options chains for a symbol (mock data)
  async getOptionsChain(symbol: string, expirationDate?: Date): Promise<OptionsChain[]> {
    const stockPrice = await this.getMarketPrice(symbol);
    const chains: OptionsChain[] = [];

    // Generate expiration dates (next 4 fridays)
    const expirationDates = [];
    const now = new Date();
    for (let i = 1; i <= 4; i++) {
      const nextFriday = new Date(now);
      nextFriday.setDate(now.getDate() + (5 - now.getDay() + 7 * (i - 1)) % 7);
      if (nextFriday <= now) {
        nextFriday.setDate(nextFriday.getDate() + 7);
      }
      expirationDates.push(nextFriday);
    }

    for (const expDate of expirationDates) {
      if (expirationDate && expDate.getTime() !== expirationDate.getTime()) continue;

      const calls: OptionContract[] = [];
      const puts: OptionContract[] = [];

      // Generate strike prices around current stock price
      const strikeSpacing = stockPrice > 100 ? 5 : 2.5;
      const numStrikes = 10;
      
      for (let i = -numStrikes/2; i <= numStrikes/2; i++) {
        const strike = Math.round((stockPrice + i * strikeSpacing) / strikeSpacing) * strikeSpacing;
        
        const callOption = await this.getOptionPrice(symbol, 'CALL', strike, expDate);
        const putOption = await this.getOptionPrice(symbol, 'PUT', strike, expDate);

        const callContract: OptionContract = {
          strike,
          bid: callOption.price * 0.98,
          ask: callOption.price * 1.02,
          lastPrice: callOption.price,
          volume: Math.floor(Math.random() * 1000),
          openInterest: Math.floor(Math.random() * 5000),
          impliedVolatility: 0.25,
          delta: callOption.greeks.delta,
          gamma: callOption.greeks.gamma,
          theta: callOption.greeks.theta,
          vega: callOption.greeks.vega,
          intrinsicValue: Math.max(stockPrice - strike, 0),
          timeValue: callOption.price - Math.max(stockPrice - strike, 0)
        };

        const putContract: OptionContract = {
          strike,
          bid: putOption.price * 0.98,
          ask: putOption.price * 1.02,
          lastPrice: putOption.price,
          volume: Math.floor(Math.random() * 1000),
          openInterest: Math.floor(Math.random() * 5000),
          impliedVolatility: 0.25,
          delta: putOption.greeks.delta,
          gamma: putOption.greeks.gamma,
          theta: putOption.greeks.theta,
          vega: putOption.greeks.vega,
          intrinsicValue: Math.max(strike - stockPrice, 0),
          timeValue: putOption.price - Math.max(strike - stockPrice, 0)
        };

        calls.push(callContract);
        puts.push(putContract);
      }

      chains.push({
        symbol,
        expirationDate: expDate,
        calls,
        puts
      });
    }

    return chains;
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
          let currentPrice: number;
          let marketValue: number;
          const contractSize = position.contractSize || (position.isOptions ? 100 : 1);

          if (position.isOptions && position.optionType && position.strikePrice && position.expirationDate) {
            // Update options position
            const optionData = await this.getOptionPrice(
              position.symbol,
              position.optionType,
              position.strikePrice,
              new Date(position.expirationDate)
            );
            currentPrice = optionData.price;
            marketValue = currentPrice * position.quantity * contractSize;

            return {
              ...position,
              currentPrice,
              marketValue,
              unrealizedPnL: marketValue - (position.averagePrice * position.quantity * contractSize),
              unrealizedPnLPercent: ((marketValue - (position.averagePrice * position.quantity * contractSize)) / (position.averagePrice * position.quantity * contractSize)) * 100,
              // Update Greeks
              delta: optionData.greeks.delta,
              gamma: optionData.greeks.gamma,
              theta: optionData.greeks.theta,
              vega: optionData.greeks.vega,
              intrinsicValue: position.optionType === 'CALL' 
                ? Math.max((await this.getMarketPrice(position.symbol)) - position.strikePrice, 0)
                : Math.max(position.strikePrice - (await this.getMarketPrice(position.symbol)), 0),
              timeValue: currentPrice - (position.optionType === 'CALL' 
                ? Math.max((await this.getMarketPrice(position.symbol)) - position.strikePrice, 0)
                : Math.max(position.strikePrice - (await this.getMarketPrice(position.symbol)), 0))
            };
          } else {
            // Update stock position
            currentPrice = await this.getMarketPrice(position.symbol);
            marketValue = currentPrice * position.quantity;
            const unrealizedPnL = marketValue - (position.averagePrice * position.quantity);
            const unrealizedPnLPercent = (unrealizedPnL / (position.averagePrice * position.quantity)) * 100;

            return {
              ...position,
              currentPrice,
              marketValue,
              unrealizedPnL,
              unrealizedPnLPercent
            };
          }
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
    // Options fields
    isOptions?: boolean;
    optionType?: 'CALL' | 'PUT';
    strikePrice?: number;
    expirationDate?: Date;
  }): Promise<string> {
    const portfolio = await this.getPortfolio();
    
    let marketPrice: number;
    let contractSize = 1;
    
    if (tradeRequest.isOptions && tradeRequest.optionType && tradeRequest.strikePrice && tradeRequest.expirationDate) {
      // Options trading
      contractSize = 100; // Standard option contract size
      if (tradeRequest.orderType === 'LIMIT' && tradeRequest.limitPrice) {
        marketPrice = tradeRequest.limitPrice;
      } else {
        const optionData = await this.getOptionPrice(
          tradeRequest.symbol,
          tradeRequest.optionType,
          tradeRequest.strikePrice,
          tradeRequest.expirationDate
        );
        marketPrice = optionData.price;
      }
    } else {
      // Stock trading
      marketPrice = tradeRequest.orderType === 'LIMIT' && tradeRequest.limitPrice 
        ? tradeRequest.limitPrice 
        : await this.getMarketPrice(tradeRequest.symbol);
    }

    const totalCost = marketPrice * tradeRequest.quantity * contractSize;
    
    // Validate trade
    if (tradeRequest.action === 'BUY' && totalCost > portfolio.cashBalance) {
      throw new Error('Insufficient cash balance');
    }

    if (tradeRequest.action === 'SELL') {
      let positionKey: string;
      if (tradeRequest.isOptions) {
        positionKey = `${tradeRequest.symbol}_${tradeRequest.optionType}_${tradeRequest.strikePrice}_${tradeRequest.expirationDate?.toISOString()}`;
      } else {
        positionKey = tradeRequest.symbol;
      }
      
      const existingPosition = portfolio.positions.find(p => {
        if (tradeRequest.isOptions) {
          return p.symbol === tradeRequest.symbol && 
                 p.isOptions === true &&
                 p.optionType === tradeRequest.optionType &&
                 p.strikePrice === tradeRequest.strikePrice &&
                 p.expirationDate?.toISOString() === tradeRequest.expirationDate?.toISOString();
        } else {
          return p.symbol === tradeRequest.symbol && !p.isOptions;
        }
      });
      
      if (!existingPosition || existingPosition.quantity < tradeRequest.quantity) {
        throw new Error(`Insufficient ${tradeRequest.isOptions ? 'option contracts' : 'shares'} to sell`);
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
      status: 'active',
      // Options fields
      isOptions: tradeRequest.isOptions,
      optionType: tradeRequest.optionType,
      strikePrice: tradeRequest.strikePrice,
      expirationDate: tradeRequest.expirationDate,
      contractSize: contractSize
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

// Export the service class and its methods
export { PaperTradingService };
