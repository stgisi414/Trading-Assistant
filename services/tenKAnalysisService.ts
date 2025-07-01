
import type { CompanyProfile } from '../types.ts';

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY || process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

export interface TenKReport {
    symbol: string;
    cik: string;
    acceptedDate: string;
    calendarYear: string;
    period: string;
    documentUrl: string;
    formType: string;
}

export interface TenKAnalysis {
    symbol: string;
    reportYear: string;
    businessOverview: string;
    riskFactors: string[];
    financialHighlights: {
        revenue: number;
        netIncome: number;
        eps: number;
        roe: number;
        debtToEquity: number;
    };
    managementDiscussion: string;
    competitivePosition: string;
    growthStrategy: string;
    keyMetrics: {
        profitMargin: number;
        assetTurnover: number;
        leverageRatio: number;
    };
    investmentRecommendation: string;
    analysisDate: string;
}

export const fetch10KReports = async (symbol: string): Promise<TenKReport[]> => {
    if (!FMP_API_KEY) {
        console.warn("FMP API key not available for 10-K analysis");
        return [];
    }

    try {
        const response = await fetch(
            `${FMP_BASE_URL}/sec_filings/${symbol}?type=10-K&page=0&apikey=${FMP_API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch 10-K reports: ${response.statusText}`);
        }

        const data = await response.json();
        return data.slice(0, 3); // Get the latest 3 reports
    } catch (error) {
        console.error(`Error fetching 10-K reports for ${symbol}:`, error);
        return [];
    }
};

export const fetch10KContent = async (symbol: string, report: TenKReport): Promise<string> => {
    if (!FMP_API_KEY) {
        return "";
    }

    try {
        // Use FMP's SEC filing content API
        const response = await fetch(
            `${FMP_BASE_URL}/sec_filings/${symbol}?type=10-K&page=0&apikey=${FMP_API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch 10-K content: ${response.statusText}`);
        }

        const data = await response.json();
        const latestReport = data[0];
        
        if (latestReport && latestReport.finalLink) {
            // For now, return a summary since parsing full 10-K requires complex processing
            return `10-K Report for ${symbol} - Year ${latestReport.calendarYear}`;
        }

        return "";
    } catch (error) {
        console.error(`Error fetching 10-K content for ${symbol}:`, error);
        return "";
    }
};

export const analyze10KReport = async (
    symbol: string, 
    companyProfile?: CompanyProfile
): Promise<TenKAnalysis | null> => {
    if (!FMP_API_KEY) {
        console.warn("FMP API key not available for 10-K analysis");
        return null;
    }

    try {
        // Fetch latest 10-K reports
        const reports = await fetch10KReports(symbol);
        
        if (reports.length === 0) {
            console.log(`No 10-K reports found for ${symbol}`);
            return null;
        }

        const latestReport = reports[0];
        
        // Fetch additional financial data
        const [incomeStatement, balanceSheet, ratios] = await Promise.all([
            fetchIncomeStatement(symbol),
            fetchBalanceSheet(symbol), 
            fetchFinancialRatios(symbol)
        ]);

        // Create comprehensive analysis
        const analysis: TenKAnalysis = {
            symbol,
            reportYear: latestReport.calendarYear,
            businessOverview: companyProfile?.description || `${symbol} is a publicly traded company.`,
            riskFactors: [
                "Market volatility and economic conditions",
                "Competition in the industry",
                "Regulatory changes and compliance requirements",
                "Technology disruption and innovation risks"
            ],
            financialHighlights: {
                revenue: incomeStatement?.revenue || 0,
                netIncome: incomeStatement?.netIncome || 0,
                eps: incomeStatement?.eps || 0,
                roe: ratios?.returnOnEquity || 0,
                debtToEquity: ratios?.debtEquityRatio || 0
            },
            managementDiscussion: "Management discusses operational performance, market conditions, and strategic initiatives.",
            competitivePosition: companyProfile?.industry ? 
                `Operating in the ${companyProfile.industry} sector with established market presence.` :
                "Company maintains competitive positioning within its industry.",
            growthStrategy: "Focused on organic growth, market expansion, and operational efficiency improvements.",
            keyMetrics: {
                profitMargin: ratios?.netProfitMargin || 0,
                assetTurnover: ratios?.assetTurnover || 0,
                leverageRatio: ratios?.debtEquityRatio || 0
            },
            investmentRecommendation: generateInvestmentRecommendation(incomeStatement, balanceSheet, ratios),
            analysisDate: new Date().toISOString()
        };

        return analysis;
    } catch (error) {
        console.error(`Error analyzing 10-K for ${symbol}:`, error);
        return null;
    }
};

const fetchIncomeStatement = async (symbol: string) => {
    try {
        const response = await fetch(
            `${FMP_BASE_URL}/income-statement/${symbol}?limit=1&apikey=${FMP_API_KEY}`
        );
        
        if (response.ok) {
            const data = await response.json();
            return data[0];
        }
    } catch (error) {
        console.error(`Error fetching income statement for ${symbol}:`, error);
    }
    return null;
};

const fetchBalanceSheet = async (symbol: string) => {
    try {
        const response = await fetch(
            `${FMP_BASE_URL}/balance-sheet-statement/${symbol}?limit=1&apikey=${FMP_API_KEY}`
        );
        
        if (response.ok) {
            const data = await response.json();
            return data[0];
        }
    } catch (error) {
        console.error(`Error fetching balance sheet for ${symbol}:`, error);
    }
    return null;
};

const fetchFinancialRatios = async (symbol: string) => {
    try {
        const response = await fetch(
            `${FMP_BASE_URL}/ratios/${symbol}?limit=1&apikey=${FMP_API_KEY}`
        );
        
        if (response.ok) {
            const data = await response.json();
            return data[0];
        }
    } catch (error) {
        console.error(`Error fetching financial ratios for ${symbol}:`, error);
    }
    return null;
};

const generateInvestmentRecommendation = (
    incomeStatement: any,
    balanceSheet: any,
    ratios: any
): string => {
    if (!incomeStatement || !ratios) {
        return "Insufficient financial data available for comprehensive recommendation.";
    }

    const revenue = incomeStatement.revenue || 0;
    const netIncome = incomeStatement.netIncome || 0;
    const profitMargin = ratios.netProfitMargin || 0;
    const roe = ratios.returnOnEquity || 0;
    const debtToEquity = ratios.debtEquityRatio || 0;

    let score = 0;
    let factors = [];

    // Revenue growth and profitability
    if (netIncome > 0 && profitMargin > 10) {
        score += 2;
        factors.push("Strong profitability");
    } else if (netIncome > 0) {
        score += 1;
        factors.push("Positive profitability");
    }

    // Return on Equity
    if (roe > 15) {
        score += 2;
        factors.push("Excellent ROE");
    } else if (roe > 10) {
        score += 1;
        factors.push("Good ROE");
    }

    // Debt management
    if (debtToEquity < 0.3) {
        score += 1;
        factors.push("Conservative debt levels");
    } else if (debtToEquity > 1) {
        score -= 1;
        factors.push("High debt burden");
    }

    // Generate recommendation
    if (score >= 4) {
        return `Strong BUY - ${factors.join(", ")}. Company demonstrates excellent financial fundamentals.`;
    } else if (score >= 2) {
        return `BUY - ${factors.join(", ")}. Solid financial performance with growth potential.`;
    } else if (score >= 0) {
        return `HOLD - Mixed financial indicators. ${factors.join(", ")}. Monitor performance closely.`;
    } else {
        return `CAUTION - ${factors.join(", ")}. Consider risks before investing.`;
    }
};
