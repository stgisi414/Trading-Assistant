
import type { AnalysisResult } from '../types.ts';

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY || process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

export interface TenKData {
    symbol: string;
    fillingDate: string;
    acceptedDate: string;
    cik: string;
    type: string;
    link: string;
    finalLink: string;
}

export interface TenKAnalysis {
    symbol: string;
    reportDate: string;
    keyFindings: string[];
    riskFactors: string[];
    businessOverview: string;
    financialHighlights: string;
    managementDiscussion: string;
    competitivePosition: string;
    futureOutlook: string;
    investmentImplications: string;
    analysisConfidence: number;
}

export const fetch10KReports = async (symbol: string): Promise<TenKData[]> => {
    if (!FMP_API_KEY) {
        console.warn("FMP_API_KEY not available for 10-K analysis");
        return [];
    }

    try {
        const response = await fetch(
            `${FMP_BASE_URL}/form-ten-k?symbol=${symbol}&page=0&apikey=${FMP_API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch 10-K reports: ${response.statusText}`);
        }

        const data = await response.json();
        return Array.isArray(data) ? data.slice(0, 3) : []; // Get latest 3 reports
    } catch (error) {
        console.error(`Error fetching 10-K reports for ${symbol}:`, error);
        return [];
    }
};

export const fetch10KContent = async (reportUrl: string): Promise<string> => {
    if (!FMP_API_KEY) {
        return "";
    }

    try {
        // Use FMP's 10-K content endpoint
        const cik = reportUrl.split('/')[4]; // Extract CIK from URL
        const year = reportUrl.split('/')[5]; // Extract year from URL
        
        const response = await fetch(
            `${FMP_BASE_URL}/form-ten-k/${cik}/${year}?apikey=${FMP_API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch 10-K content: ${response.statusText}`);
        }

        const data = await response.json();
        return data[0]?.content || "";
    } catch (error) {
        console.error("Error fetching 10-K content:", error);
        return "";
    }
};

export const analyze10KWithGemini = async (
    symbol: string,
    content: string,
    reportDate: string
): Promise<TenKAnalysis> => {
    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        
        if (!apiKey) {
            throw new Error("Gemini API key not found");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        Analyze this 10-K report for ${symbol} filed on ${reportDate}. Extract and analyze the following key information:

        1. KEY FINDINGS: Identify 5-7 most important financial and business developments
        2. RISK FACTORS: Summarize the main risk factors that could impact the business
        3. BUSINESS OVERVIEW: Provide a concise overview of the company's business model and operations
        4. FINANCIAL HIGHLIGHTS: Extract key financial metrics and year-over-year changes
        5. MANAGEMENT DISCUSSION: Summarize management's discussion of financial condition and results
        6. COMPETITIVE POSITION: Analyze the company's competitive advantages and market position
        7. FUTURE OUTLOOK: Extract forward-looking statements and strategic initiatives
        8. INVESTMENT IMPLICATIONS: Provide investment-relevant insights based on the analysis

        Please format your response as JSON with the following structure:
        {
            "keyFindings": ["finding1", "finding2", ...],
            "riskFactors": ["risk1", "risk2", ...],
            "businessOverview": "overview text",
            "financialHighlights": "highlights text",
            "managementDiscussion": "discussion text",
            "competitivePosition": "position text",
            "futureOutlook": "outlook text",
            "investmentImplications": "implications text",
            "analysisConfidence": 85
        }

        10-K Content (truncated for analysis):
        ${content.substring(0, 50000)}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const analysisData = JSON.parse(jsonMatch[0]);
            return {
                symbol,
                reportDate,
                ...analysisData
            };
        }

        throw new Error("Could not parse 10-K analysis response");
    } catch (error) {
        console.error("Error analyzing 10-K with Gemini:", error);
        // Return mock analysis if Gemini fails
        return {
            symbol,
            reportDate,
            keyFindings: [
                "10-K analysis temporarily unavailable",
                "Please try again later or check manually"
            ],
            riskFactors: ["Analysis service temporarily unavailable"],
            businessOverview: "10-K analysis service is temporarily unavailable. Please try again later.",
            financialHighlights: "Analysis pending",
            managementDiscussion: "Analysis pending",
            competitivePosition: "Analysis pending", 
            futureOutlook: "Analysis pending",
            investmentImplications: "Analysis pending",
            analysisConfidence: 0
        };
    }
};

export const performComplete10KAnalysis = async (symbol: string): Promise<TenKAnalysis | null> => {
    try {
        console.log(`Starting 10-K analysis for ${symbol}...`);
        
        // Fetch available 10-K reports
        const reports = await fetch10KReports(symbol);
        
        if (reports.length === 0) {
            console.log(`No 10-K reports found for ${symbol}`);
            return null;
        }

        // Get the most recent report
        const latestReport = reports[0];
        console.log(`Found latest 10-K report for ${symbol} filed on ${latestReport.fillingDate}`);

        // Fetch the report content
        const content = await fetch10KContent(latestReport.finalLink);
        
        if (!content) {
            console.log(`Could not fetch 10-K content for ${symbol}`);
            return null;
        }

        // Analyze with Gemini
        const analysis = await analyze10KWithGemini(symbol, content, latestReport.fillingDate);
        
        console.log(`✅ Completed 10-K analysis for ${symbol}`);
        return analysis;
    } catch (error) {
        console.error(`Error in complete 10-K analysis for ${symbol}:`, error);
        return null;
    }
};
