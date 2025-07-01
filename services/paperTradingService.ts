
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

  // Get current market price for a symbol using FMP Quote API
  private async getMarketPrice(symbol: string): Promise<number> {
    const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY || process.env.FMP_API_KEY;
    const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

    // Fallback mock prices if API is unavailable
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

    // If no API key, use mock data with variation
    if (!FMP_API_KEY) {
      console.warn(`No FMP API key available for paper trading, using mock price for ${symbol}`);
      const basePrice = mockPrices[symbol] || 100;
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      return basePrice * (1 + variation);
    }

    try {
      // Use FMP Quote API to get real-time price
      const url = `${FMP_BASE_URL}/quote/${symbol}?apikey=${FMP_API_KEY}`;
      
      // Add timeout for faster fallback
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0 && data[0].price) {
          const price = Number(data[0].price);
          if (price > 0) {
            console.log(`✅ Real market price for ${symbol}: $${price}`);
            return price;
          }
        }
        
        console.warn(`Invalid price data from FMP API for ${symbol}:`, data);
      } else {
        console.warn(`FMP Quote API returned ${response.status}: ${response.statusText} for ${symbol}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`Request timeout for ${symbol} market price, falling back to mock data`);
      } else {
        console.warn(`Failed to fetch real market price for ${symbol}:`, error);
      }
    }

    // Fallback to mock data with variation
    console.log(`Using mock price for ${symbol} paper trading`);
    const basePrice = mockPrices[symbol] || 100;
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    return basePrice * (1 + variation);
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
      // Check pending orders and stop loss/take profit conditions
      await this.checkPendingOrders();
      await this.checkStopLossAndTakeProfit();
      
      const portfolio = await firebaseService.loadPaperTradingPortfolio();
      if (!portfolio) {
        return await this.initializePortfolio();
      }

      const now = new Date();
      let expiredOptionsFound = false;

      // Update positions with current market prices and check for expired options
      const updatedPositions = await Promise.all(
        portfolio.positions.map(async (position) => {
          let currentPrice: number;
          let marketValue: number;
          const contractSize = position.contractSize || (position.isOptions ? 100 : 1);

          if (position.isOptions && position.optionType && position.strikePrice && position.expirationDate) {
            const expirationDate = new Date(position.expirationDate);
            
            // Check if option has expired
            if (expirationDate <= now) {
              expiredOptionsFound = true;
              // Calculate final intrinsic value at expiration
              const stockPrice = await this.getMarketPrice(position.symbol);
              const intrinsicValue = position.optionType === 'CALL' 
                ? Math.max(stockPrice - position.strikePrice, 0)
                : Math.max(position.strikePrice - stockPrice, 0);
              
              currentPrice = intrinsicValue;
              marketValue = intrinsicValue * position.quantity * contractSize;

              // Auto-exercise if in-the-money, otherwise expire worthless
              if (intrinsicValue > 0) {
                console.log(`Option ${position.symbol} ${position.optionType} ${position.strikePrice} expired in-the-money with intrinsic value: $${intrinsicValue}`);
              } else {
                console.log(`Option ${position.symbol} ${position.optionType} ${position.strikePrice} expired worthless`);
              }

              return {
                ...position,
                currentPrice,
                marketValue,
                unrealizedPnL: marketValue - (position.averagePrice * position.quantity * contractSize),
                unrealizedPnLPercent: marketValue > 0 ? ((marketValue - (position.averagePrice * position.quantity * contractSize)) / (position.averagePrice * position.quantity * contractSize)) * 100 : -100,
                // Set Greeks to zero for expired options
                delta: 0,
                gamma: 0,
                theta: 0,
                vega: 0,
                intrinsicValue,
                timeValue: 0
              };
            } else {
              // Update active options position
              const optionData = await this.getOptionPrice(
                position.symbol,
                position.optionType,
                position.strikePrice,
                expirationDate
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
            }
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

      // Auto-close expired worthless options
      const activePositions = updatedPositions.filter(position => {
        if (position.isOptions && position.expirationDate) {
          const expirationDate = new Date(position.expirationDate);
          if (expirationDate <= now && position.currentPrice === 0) {
            console.log(`Auto-removing expired worthless option: ${position.symbol} ${position.optionType} ${position.strikePrice}`);
            return false; // Remove worthless expired options
          }
        }
        return true;
      });

      const totalPositionValue = activePositions.reduce((sum, pos) => sum + pos.marketValue, 0);
      const updatedPortfolio: PaperTradingPortfolio = {
        ...portfolio,
        positions: activePositions,
        totalValue: portfolio.cashBalance + totalPositionValue,
        updatedAt: new Date()
      };

      // If expired options were found, also close any related active trades
      if (expiredOptionsFound) {
        await this.closeExpiredOptionTrades();
      }

      // Save updated portfolio
      await firebaseService.savePaperTradingPortfolio(updatedPortfolio);
      return updatedPortfolio;
    } catch (error) {
      console.error('Error getting portfolio:', error);
      return await this.initializePortfolio();
    }
  }

  // Check and execute pending limit orders
  private async checkPendingOrders(): Promise<void> {
    try {
      const trades = await firebaseService.loadPaperTrades();
      const pendingTrades = trades.filter(t => t.status === 'pending');
      
      for (const trade of pendingTrades) {
        let currentPrice: number;
        
        if (trade.isOptions && trade.optionType && trade.strikePrice && trade.expirationDate) {
          const optionData = await this.getOptionPrice(
            trade.symbol,
            trade.optionType,
            trade.strikePrice,
            trade.expirationDate
          );
          currentPrice = optionData.price;
        } else {
          currentPrice = await this.getMarketPrice(trade.symbol);
        }
        
        let shouldExecute = false;
        
        if (trade.limitPrice) {
          if (trade.action === 'BUY' && currentPrice <= trade.limitPrice) {
            shouldExecute = true;
          } else if (trade.action === 'SELL' && currentPrice >= trade.limitPrice) {
            shouldExecute = true;
          }
        }
        
        if (shouldExecute) {
          // Execute the trade at current market price (simulating partial fill)
          const executionPrice = currentPrice;
          await this.executeTrade(trade, executionPrice);
        }
      }
    } catch (error) {
      console.error('Error checking pending orders:', error);
    }
  }

  // Execute a pending trade
  private async executeTrade(trade: PaperTrade, executionPrice: number): Promise<void> {
    const portfolio = await this.getPortfolio();
    const contractSize = trade.contractSize || 1;
    const totalCost = executionPrice * trade.quantity * contractSize;
    
    // Validate execution
    if (trade.action === 'BUY' && totalCost > portfolio.cashBalance) {
      // Cancel order due to insufficient funds
      const cancelledTrade = {
        ...trade,
        status: 'cancelled' as const,
        reasoning: (trade.reasoning || '') + ' [Cancelled: Insufficient funds]'
      };
      await firebaseService.savePaperTrade(cancelledTrade);
      return;
    }
    
    // Update trade status and execution price
    const executedTrade = {
      ...trade,
      status: 'active' as const,
      price: executionPrice,
      timestamp: new Date()
    };
    
    // Update portfolio positions (similar to existing logic)
    await this.updatePortfolioAfterTrade(trade, executionPrice);
    await firebaseService.savePaperTrade(executedTrade);
  }

  // Check stop loss and take profit conditions for active positions
  private async checkStopLossAndTakeProfit(): Promise<void> {
    try {
      const trades = await firebaseService.loadPaperTrades();
      const activeTrades = trades.filter(t => t.status === 'active' && (t.stopLoss || t.takeProfit));
      
      for (const trade of activeTrades) {
        let currentPrice: number;
        
        if (trade.isOptions && trade.optionType && trade.strikePrice && trade.expirationDate) {
          const optionData = await this.getOptionPrice(
            trade.symbol,
            trade.optionType,
            trade.strikePrice,
            trade.expirationDate
          );
          currentPrice = optionData.price;
        } else {
          currentPrice = await this.getMarketPrice(trade.symbol);
        }
        
        let shouldClose = false;
        let reason = '';
        
        // Check stop loss
        if (trade.stopLoss) {
          if ((trade.action === 'BUY' && currentPrice <= trade.stopLoss) ||
              (trade.action === 'SELL' && currentPrice >= trade.stopLoss)) {
            shouldClose = true;
            reason = 'Stop Loss triggered';
          }
        }
        
        // Check take profit
        if (trade.takeProfit && !shouldClose) {
          if ((trade.action === 'BUY' && currentPrice >= trade.takeProfit) ||
              (trade.action === 'SELL' && currentPrice <= trade.takeProfit)) {
            shouldClose = true;
            reason = 'Take Profit triggered';
          }
        }
        
        if (shouldClose) {
          await this.autoCloseTrade(trade, currentPrice, reason);
        }
      }
    } catch (error) {
      console.error('Error checking stop loss/take profit:', error);
    }
  }

  // Auto-close a trade due to stop loss or take profit
  private async autoCloseTrade(trade: PaperTrade, currentPrice: number, reason: string): Promise<void> {
    const closeAction = trade.action === 'BUY' ? 'SELL' : 'BUY';
    
    // Place closing trade at current market price
    await this.placeTrade({
      symbol: trade.symbol,
      action: closeAction,
      quantity: trade.quantity,
      orderType: 'MARKET',
      reasoning: `${reason} - Auto-closing trade ${trade.id}`,
      isOptions: trade.isOptions,
      optionType: trade.optionType,
      strikePrice: trade.strikePrice,
      expirationDate: trade.expirationDate
    });
    
    // Update original trade
    const updatedTrade = {
      ...trade,
      status: 'closed' as const,
      closedAt: new Date(),
      reasoning: (trade.reasoning || '') + ` [${reason}]`
    };
    
    await firebaseService.savePaperTrade(updatedTrade);
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
    let executeImmediately = false;
    
    if (tradeRequest.isOptions && tradeRequest.optionType && tradeRequest.strikePrice && tradeRequest.expirationDate) {
      // Options trading
      contractSize = 100; // Standard option contract size
      const optionData = await this.getOptionPrice(
        tradeRequest.symbol,
        tradeRequest.optionType,
        tradeRequest.strikePrice,
        tradeRequest.expirationDate
      );
      marketPrice = optionData.price;
      
      if (tradeRequest.orderType === 'LIMIT' && tradeRequest.limitPrice) {
        // Check if limit order can be executed immediately
        if ((tradeRequest.action === 'BUY' && tradeRequest.limitPrice >= marketPrice) ||
            (tradeRequest.action === 'SELL' && tradeRequest.limitPrice <= marketPrice)) {
          executeImmediately = true;
          marketPrice = tradeRequest.limitPrice;
        }
      } else {
        executeImmediately = true;
      }
    } else {
      // Stock trading
      marketPrice = await this.getMarketPrice(tradeRequest.symbol);
      
      if (tradeRequest.orderType === 'LIMIT' && tradeRequest.limitPrice) {
        // Check if limit order can be executed immediately
        if ((tradeRequest.action === 'BUY' && tradeRequest.limitPrice >= marketPrice) ||
            (tradeRequest.action === 'SELL' && tradeRequest.limitPrice <= marketPrice)) {
          executeImmediately = true;
          marketPrice = tradeRequest.limitPrice;
        }
      } else {
        executeImmediately = true;
      }
    }

    const totalCost = marketPrice * tradeRequest.quantity * contractSize;
    
    // Validate trade
    if (tradeRequest.action === 'BUY' && totalCost > portfolio.cashBalance) {
      throw new Error('Insufficient cash balance');
    }

    if (tradeRequest.action === 'SELL') {
      const existingPosition = portfolio.positions.find(p => {
        if (tradeRequest.isOptions) {
          return p.symbol === tradeRequest.symbol && 
                 p.isOptions === true &&
                 p.optionType === tradeRequest.optionType &&
                 p.strikePrice === tradeRequest.strikePrice &&
                 p.expirationDate && tradeRequest.expirationDate &&
                 new Date(p.expirationDate).getTime() === tradeRequest.expirationDate.getTime();
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
      price: executeImmediately ? marketPrice : 0, // Set to 0 for pending orders
      orderType: tradeRequest.orderType,
      limitPrice: tradeRequest.limitPrice,
      stopLoss: tradeRequest.stopLoss,
      takeProfit: tradeRequest.takeProfit,
      reasoning: tradeRequest.reasoning,
      timestamp: new Date(),
      status: executeImmediately ? 'active' : 'pending',
      // Options fields
      isOptions: tradeRequest.isOptions,
      optionType: tradeRequest.optionType,
      strikePrice: tradeRequest.strikePrice,
      expirationDate: tradeRequest.expirationDate,
      contractSize: contractSize
    };

    // If it's a pending limit order, just save it and return
    if (!executeImmediately) {
      await firebaseService.savePaperTrade(trade);
      return trade.id;
    }

    // Update portfolio
    const updatedPortfolio = { ...portfolio };
    
    if (tradeRequest.action === 'BUY') {
      // Reduce cash balance
      updatedPortfolio.cashBalance -= totalCost;
      
      // Find existing position using the same logic as for selling
      const existingPositionIndex = updatedPortfolio.positions.findIndex(p => {
        if (tradeRequest.isOptions) {
          return p.symbol === tradeRequest.symbol && 
                 p.isOptions === true &&
                 p.optionType === tradeRequest.optionType &&
                 p.strikePrice === tradeRequest.strikePrice &&
                 p.expirationDate && tradeRequest.expirationDate &&
                 new Date(p.expirationDate).getTime() === tradeRequest.expirationDate.getTime();
        } else {
          return p.symbol === tradeRequest.symbol && !p.isOptions;
        }
      });

      if (existingPositionIndex >= 0) {
        const existingPosition = updatedPortfolio.positions[existingPositionIndex];
        const totalQuantity = existingPosition.quantity + tradeRequest.quantity;
        const totalPositionCost = (existingPosition.averagePrice * existingPosition.quantity * (existingPosition.contractSize || 1)) + totalCost;
        
        updatedPortfolio.positions[existingPositionIndex] = {
          ...existingPosition,
          quantity: totalQuantity,
          averagePrice: totalPositionCost / (totalQuantity * contractSize),
          currentPrice: marketPrice,
          marketValue: marketPrice * totalQuantity * contractSize,
          unrealizedPnL: (marketPrice * totalQuantity * contractSize) - totalPositionCost,
          unrealizedPnLPercent: ((marketPrice * totalQuantity * contractSize) - totalPositionCost) / totalPositionCost * 100
        };
      } else {
        // Create new position
        const newPosition: any = {
          symbol: tradeRequest.symbol,
          quantity: tradeRequest.quantity,
          averagePrice: marketPrice,
          currentPrice: marketPrice,
          marketValue: totalCost,
          unrealizedPnL: 0,
          unrealizedPnLPercent: 0
        };

        // Add options-specific fields if this is an options trade
        if (tradeRequest.isOptions) {
          newPosition.isOptions = true;
          newPosition.optionType = tradeRequest.optionType;
          newPosition.strikePrice = tradeRequest.strikePrice;
          newPosition.expirationDate = tradeRequest.expirationDate;
          newPosition.contractSize = contractSize;
        }

        updatedPortfolio.positions.push(newPosition);
      }
    } else { // SELL
      // Add to cash balance
      updatedPortfolio.cashBalance += totalCost;
      
      // Find existing position using the same logic as validation
      const existingPositionIndex = updatedPortfolio.positions.findIndex(p => {
        if (tradeRequest.isOptions) {
          return p.symbol === tradeRequest.symbol && 
                 p.isOptions === true &&
                 p.optionType === tradeRequest.optionType &&
                 p.strikePrice === tradeRequest.strikePrice &&
                 p.expirationDate && tradeRequest.expirationDate &&
                 new Date(p.expirationDate).getTime() === tradeRequest.expirationDate.getTime();
        } else {
          return p.symbol === tradeRequest.symbol && !p.isOptions;
        }
      });

      if (existingPositionIndex >= 0) {
        const existingPosition = updatedPortfolio.positions[existingPositionIndex];
        const newQuantity = existingPosition.quantity - tradeRequest.quantity;
        const positionContractSize = existingPosition.contractSize || 1;
        
        if (newQuantity === 0) {
          // Remove position entirely
          updatedPortfolio.positions.splice(existingPositionIndex, 1);
        } else {
          // Update position quantity
          updatedPortfolio.positions[existingPositionIndex] = {
            ...existingPosition,
            quantity: newQuantity,
            currentPrice: marketPrice,
            marketValue: marketPrice * newQuantity * positionContractSize,
            unrealizedPnL: (marketPrice * newQuantity * positionContractSize) - (existingPosition.averagePrice * newQuantity * positionContractSize),
            unrealizedPnLPercent: ((marketPrice * newQuantity * positionContractSize) - (existingPosition.averagePrice * newQuantity * positionContractSize)) / (existingPosition.averagePrice * newQuantity * positionContractSize) * 100
          };
        }
        
        // Calculate realized P&L for the sold contracts/shares
        const realizedPnL = (marketPrice - existingPosition.averagePrice) * tradeRequest.quantity * positionContractSize;
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

  // Helper method to update portfolio after trade execution
  private async updatePortfolioAfterTrade(trade: PaperTrade, executionPrice: number): Promise<void> {
    const portfolio = await this.getPortfolio();
    const contractSize = trade.contractSize || 1;
    const totalCost = executionPrice * trade.quantity * contractSize;
    
    const updatedPortfolio = { ...portfolio };
    
    if (trade.action === 'BUY') {
      updatedPortfolio.cashBalance -= totalCost;
      
      const existingPositionIndex = updatedPortfolio.positions.findIndex(p => {
        if (trade.isOptions) {
          return p.symbol === trade.symbol && 
                 p.isOptions === true &&
                 p.optionType === trade.optionType &&
                 p.strikePrice === trade.strikePrice &&
                 p.expirationDate && trade.expirationDate &&
                 new Date(p.expirationDate).getTime() === trade.expirationDate.getTime();
        } else {
          return p.symbol === trade.symbol && !p.isOptions;
        }
      });

      if (existingPositionIndex >= 0) {
        const existingPosition = updatedPortfolio.positions[existingPositionIndex];
        const totalQuantity = existingPosition.quantity + trade.quantity;
        const totalPositionCost = (existingPosition.averagePrice * existingPosition.quantity * (existingPosition.contractSize || 1)) + totalCost;
        
        updatedPortfolio.positions[existingPositionIndex] = {
          ...existingPosition,
          quantity: totalQuantity,
          averagePrice: totalPositionCost / (totalQuantity * contractSize),
          currentPrice: executionPrice,
          marketValue: executionPrice * totalQuantity * contractSize,
          unrealizedPnL: (executionPrice * totalQuantity * contractSize) - totalPositionCost,
          unrealizedPnLPercent: ((executionPrice * totalQuantity * contractSize) - totalPositionCost) / totalPositionCost * 100
        };
      } else {
        const newPosition: any = {
          symbol: trade.symbol,
          quantity: trade.quantity,
          averagePrice: executionPrice,
          currentPrice: executionPrice,
          marketValue: totalCost,
          unrealizedPnL: 0,
          unrealizedPnLPercent: 0
        };

        if (trade.isOptions) {
          newPosition.isOptions = true;
          newPosition.optionType = trade.optionType;
          newPosition.strikePrice = trade.strikePrice;
          newPosition.expirationDate = trade.expirationDate;
          newPosition.contractSize = contractSize;
        }

        updatedPortfolio.positions.push(newPosition);
      }
    } else { // SELL
      updatedPortfolio.cashBalance += totalCost;
      
      const existingPositionIndex = updatedPortfolio.positions.findIndex(p => {
        if (trade.isOptions) {
          return p.symbol === trade.symbol && 
                 p.isOptions === true &&
                 p.optionType === trade.optionType &&
                 p.strikePrice === trade.strikePrice &&
                 p.expirationDate && trade.expirationDate &&
                 new Date(p.expirationDate).getTime() === trade.expirationDate.getTime();
        } else {
          return p.symbol === trade.symbol && !p.isOptions;
        }
      });

      if (existingPositionIndex >= 0) {
        const existingPosition = updatedPortfolio.positions[existingPositionIndex];
        const newQuantity = existingPosition.quantity - trade.quantity;
        
        if (newQuantity === 0) {
          updatedPortfolio.positions.splice(existingPositionIndex, 1);
        } else {
          updatedPortfolio.positions[existingPositionIndex] = {
            ...existingPosition,
            quantity: newQuantity,
            currentPrice: executionPrice,
            marketValue: executionPrice * newQuantity * contractSize,
            unrealizedPnL: (executionPrice * newQuantity * contractSize) - (existingPosition.averagePrice * newQuantity * contractSize),
            unrealizedPnLPercent: ((executionPrice * newQuantity * contractSize) - (existingPosition.averagePrice * newQuantity * contractSize)) / (existingPosition.averagePrice * newQuantity * contractSize) * 100
          };
        }
      }
    }

    const totalPositionValue = updatedPortfolio.positions.reduce((sum, pos) => sum + pos.marketValue, 0);
    updatedPortfolio.totalValue = updatedPortfolio.cashBalance + totalPositionValue;
    updatedPortfolio.updatedAt = new Date();

    await firebaseService.savePaperTradingPortfolio(updatedPortfolio);
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
      reasoning: `Closing position for trade ${tradeId}`,
      // Include options parameters if this is an options trade
      isOptions: trade.isOptions,
      optionType: trade.optionType,
      strikePrice: trade.strikePrice,
      expirationDate: trade.expirationDate
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

  // Close expired option trades
  private async closeExpiredOptionTrades(): Promise<void> {
    try {
      const trades = await firebaseService.loadPaperTrades();
      const now = new Date();
      
      const expiredTrades = trades.filter(trade => 
        trade.status === 'active' && 
        trade.isOptions && 
        trade.expirationDate && 
        new Date(trade.expirationDate) <= now
      );

      for (const trade of expiredTrades) {
        const stockPrice = await this.getMarketPrice(trade.symbol);
        const intrinsicValue = trade.optionType === 'CALL' 
          ? Math.max(stockPrice - (trade.strikePrice || 0), 0)
          : Math.max((trade.strikePrice || 0) - stockPrice, 0);

        const contractSize = trade.contractSize || 100;
        const finalValue = intrinsicValue * trade.quantity * contractSize;
        const realizedPnL = finalValue - (trade.price * trade.quantity * contractSize);

        // Update trade status to closed
        const updatedTrade = {
          ...trade,
          status: 'closed' as const,
          closedAt: now,
          realizedPnL,
          reasoning: trade.reasoning + ` [Auto-closed on expiration: ${intrinsicValue > 0 ? 'ITM' : 'OTM'}]`
        };

        await firebaseService.savePaperTrade(updatedTrade);
        console.log(`Auto-closed expired option trade: ${trade.symbol} ${trade.optionType} ${trade.strikePrice} with P&L: $${realizedPnL.toFixed(2)}`);
      }
    } catch (error) {
      console.error('Error closing expired option trades:', error);
    }
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
