
import { FmpSearchResult } from '../types';

const FMP_API_KEY = process.env.FMP_API_KEY || 'demo';

class SymbolValidationService {
  private static instance: SymbolValidationService;
  private symbolCache = new Map<string, FmpSearchResult | null>();

  static getInstance(): SymbolValidationService {
    if (!SymbolValidationService.instance) {
      SymbolValidationService.instance = new SymbolValidationService();
    }
    return SymbolValidationService.instance;
  }

  async validateSymbol(symbol: string): Promise<FmpSearchResult | null> {
    if (!symbol || symbol.trim().length === 0) {
      return null;
    }

    const upperSymbol = symbol.toUpperCase().trim();

    // Check cache first
    if (this.symbolCache.has(upperSymbol)) {
      return this.symbolCache.get(upperSymbol) || null;
    }

    try {
      // Use FMP search API to validate symbol
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/search?query=${upperSymbol}&limit=1&apikey=${FMP_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        // Ensure exact match (case insensitive)
        if (result.symbol.toUpperCase() === upperSymbol) {
          const validSymbol: FmpSearchResult = {
            symbol: result.symbol,
            name: result.name,
            currency: result.currency || 'USD',
            stockExchange: result.stockExchange || 'NASDAQ',
            exchangeShortName: result.exchangeShortName || 'NASDAQ'
          };
          this.symbolCache.set(upperSymbol, validSymbol);
          return validSymbol;
        }
      }

      // Symbol not found
      this.symbolCache.set(upperSymbol, null);
      return null;
    } catch (error) {
      console.error('Error validating symbol:', error);
      this.symbolCache.set(upperSymbol, null);
      return null;
    }
  }

  async searchSymbols(query: string, limit: number = 10): Promise<FmpSearchResult[]> {
    if (!query || query.trim().length < 1) {
      return [];
    }

    const upperQuery = query.toUpperCase().trim();

    try {
      const response = await fetch(
        `https://financialmodelingprep.com/api/v3/search?query=${upperQuery}&limit=${limit}&apikey=${FMP_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        return data.map((item: any) => ({
          symbol: item.symbol,
          name: item.name,
          currency: item.currency || 'USD',
          stockExchange: item.stockExchange || 'NASDAQ',
          exchangeShortName: item.exchangeShortName || 'NASDAQ'
        }));
      }

      return [];
    } catch (error) {
      console.error('Error searching symbols:', error);
      return [];
    }
  }

  clearCache(): void {
    this.symbolCache.clear();
  }
}

export const symbolValidationService = SymbolValidationService.getInstance();
export { SymbolValidationService };
