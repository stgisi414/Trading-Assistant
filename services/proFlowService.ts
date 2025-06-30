import type { FmpSearchResult } from '../types.ts';
import { INDICATOR_OPTIONS, TIMEFRAME_OPTIONS, MARKET_OPTIONS } from '../constants.ts';

export interface ProFlowStep {
    id: string;
    name: string;
    description: string;
    action: () => Promise<void>;
    delay?: number;
}

export interface ProFlowToast {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
}

export type ProFlowMode = 'auto' | 'manual';

export interface FlowPromptConfig {
    prompt: string;
    isCustom: boolean;
}

export class ProFlowService {
    private isRunning = false;
    private currentStep = 0;
    private steps: ProFlowStep[] = [];
    private mode: ProFlowMode = 'auto';
    private isPaused = false;
    private toastCallback?: (toast: ProFlowToast) => void;
    private confirmationCallback?: () => void;
    private statusChangeCallback?: () => void;
    private flowPrompt: FlowPromptConfig = { prompt: '', isCustom: false };
    private appCallbacks: {
        setSelectedSymbols?: (symbols: FmpSearchResult[]) => void;
        setWalletAmount?: (amount: string) => void;
        setSelectedIndicators?: (indicators: string[]) => void;
        setSelectedTimeframe?: (timeframe: string) => void;
        setSelectedMarketType?: (marketType: string) => void;
        setSelectedMarket?: (market: string) => void;
        handleAnalyze?: () => void;
    } = {};

    constructor() {
        this.initializeSteps();
    }

    setToastCallback(callback: (toast: ProFlowToast) => void) {
        this.toastCallback = callback;
    }

    setStatusChangeCallback(callback: () => void) {
        this.statusChangeCallback = callback;
    }

    setAppCallbacks(callbacks: typeof this.appCallbacks) {
        this.appCallbacks = callbacks;
    }

    setMode(mode: ProFlowMode) {
        this.mode = mode;
        this.notifyStatusChange();
    }

    private notifyStatusChange() {
        if (this.statusChangeCallback) {
            this.statusChangeCallback();
        }
    }

    getMode(): ProFlowMode {
        return this.mode;
    }

    setConfirmationCallback(callback: () => void) {
        this.confirmationCallback = callback;
    }

    continueFromManualPause() {
        if (this.isPaused && this.confirmationCallback) {
            this.isPaused = false;
            this.notifyStatusChange();
            const callback = this.confirmationCallback;
            this.confirmationCallback = undefined;
            callback();
        }
    }

    setFlowPrompt(prompt: string, isCustom: boolean = true) {
        this.flowPrompt = { prompt, isCustom };
        // Don't show toast on every keystroke - only when explicitly setting a meaningful prompt
    }

    confirmFlowPrompt(prompt: string) {
        this.flowPrompt = { prompt, isCustom: true };
        if (prompt.trim()) {
            this.showToast('🎯 Custom flow prompt set! ProFlow will adapt to your instructions.', 'success');
        }
    }

    getFlowPrompt(): FlowPromptConfig {
        return this.flowPrompt;
    }

    async generateFlowPrompt(): Promise<string> {
        const suggestions = [
            "Focus on cryptocurrency analysis with emphasis on technical indicators and market sentiment for swing trading opportunities",
            "Prioritize dividend-paying stocks with strong fundamentals for long-term investment strategies",
            "Analyze high-volatility tech stocks with options strategies for day trading setups",
            "Look for value stocks in underperforming sectors with potential for recovery",
            "Focus on ESG-compliant investments with sustainable growth patterns",
            "Identify momentum stocks with strong earnings growth and institutional buying",
            "Analyze commodities and futures for inflation hedge strategies",
            "Focus on small-cap growth stocks with high revenue growth potential"
        ];
        
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        this.showToast('✨ Generated flow prompt suggestion! You can modify it as needed.', 'success');
        return randomSuggestion;
    }

    async improveFlowPrompt(currentPrompt: string): Promise<string> {
        if (!currentPrompt.trim()) {
            return await this.generateFlowPrompt();
        }

        // Simple improvement logic - in a real implementation, this could use AI
        const improvements = {
            'stocks': 'equity securities with strong fundamentals',
            'crypto': 'cryptocurrency assets with high liquidity',
            'trading': 'strategic trading with risk management',
            'analysis': 'comprehensive market analysis',
            'buy': 'strategic long positions',
            'sell': 'profit-taking opportunities'
        };

        let improvedPrompt = currentPrompt;
        Object.entries(improvements).forEach(([key, value]) => {
            const regex = new RegExp(`\\b${key}\\b`, 'gi');
            if (regex.test(improvedPrompt) && !improvedPrompt.includes(value)) {
                improvedPrompt = improvedPrompt.replace(regex, value);
            }
        });

        // Add structure if missing
        if (!improvedPrompt.includes('focus') && !improvedPrompt.includes('prioritize')) {
            improvedPrompt = `Focus on ${improvedPrompt.charAt(0).toLowerCase() + improvedPrompt.slice(1)}`;
        }

        if (!improvedPrompt.includes('strategy') && !improvedPrompt.includes('approach')) {
            improvedPrompt += ' with a data-driven investment approach';
        }

        this.showToast('🧠 Prompt improved with enhanced terminology and structure!', 'success');
        return improvedPrompt;
    }

    private showToast(message: string, type: ProFlowToast['type'] = 'info', duration = 3000) {
        if (this.toastCallback) {
            let toastCounter = 0;

            toastCounter++;
            const toast: ProFlowToast = {
                id: `${Date.now()}-${toastCounter}-${Math.random().toString(36).substr(2, 9)}`,
                message,
                type,
                duration
            };
            this.toastCallback(toast);
        }
    }

    private initializeSteps() {
        this.steps = [
            {
                id: 'welcome',
                name: 'Welcome to ProFlow',
                description: 'Starting intelligent automation',
                action: async () => {
                    const promptMessage = this.flowPrompt.prompt 
                        ? `🚀 ProFlow activated with custom guidance: "${this.flowPrompt.prompt.substring(0, 50)}${this.flowPrompt.prompt.length > 50 ? '...' : ''}"`
                        : '🚀 ProFlow activated! Preparing to demonstrate Signatex capabilities...';
                    this.showToast(promptMessage, 'info', 4000);
                },
                delay: 2000
            },
            {
                id: 'market-selection',
                name: 'Select Market Type',
                description: 'Choosing optimal market type',
                action: async () => {
                    this.showToast('📊 Selecting STOCKS market for comprehensive analysis...', 'info');
                    this.appCallbacks.setSelectedMarketType?.('STOCKS');
                },
                delay: 1500
            },
            {
                id: 'market-region',
                name: 'Select Market Region',
                description: 'Setting market region',
                action: async () => {
                    this.showToast('🇺🇸 Setting market to US (NASDAQ/NYSE) for maximum liquidity...', 'info');
                    this.appCallbacks.setSelectedMarket?.('US');
                },
                delay: 1500
            },
            {
                id: 'add-symbols',
                name: 'Add Popular Symbols',
                description: 'Adding high-volume trading symbols',
                action: async () => {
                    let symbols = [
                        { symbol: 'AAPL', name: 'Apple Inc.' },
                        { symbol: 'TSLA', name: 'Tesla, Inc.' },
                        { symbol: 'MSFT', name: 'Microsoft Corporation' }
                    ];

                    // Adapt symbols based on flow prompt
                    if (this.flowPrompt.prompt) {
                        const prompt = this.flowPrompt.prompt.toLowerCase();
                        if (prompt.includes('crypto') || prompt.includes('bitcoin') || prompt.includes('ethereum')) {
                            symbols = [
                                { symbol: 'BTC-USD', name: 'Bitcoin USD' },
                                { symbol: 'ETH-USD', name: 'Ethereum USD' },
                                { symbol: 'ADA-USD', name: 'Cardano USD' }
                            ];
                        } else if (prompt.includes('medical') || prompt.includes('healthcare') || prompt.includes('pharma') || prompt.includes('biotech')) {
                            symbols = [
                                { symbol: 'JNJ', name: 'Johnson & Johnson' },
                                { symbol: 'PFE', name: 'Pfizer Inc.' },
                                { symbol: 'ABT', name: 'Abbott Laboratories' }
                            ];
                        } else if (prompt.includes('dividend') || prompt.includes('income')) {
                            symbols = [
                                { symbol: 'JNJ', name: 'Johnson & Johnson' },
                                { symbol: 'KO', name: 'Coca-Cola Company' },
                                { symbol: 'PG', name: 'Procter & Gamble' }
                            ];
                        } else if (prompt.includes('entertainment') || prompt.includes('media') || prompt.includes('streaming')) {
                            symbols = [
                                { symbol: 'DIS', name: 'Walt Disney Company' },
                                { symbol: 'NFLX', name: 'Netflix Inc.' },
                                { symbol: 'WBD', name: 'Warner Bros. Discovery' }
                            ];
                        } else if (prompt.includes('small-cap') || prompt.includes('growth')) {
                            symbols = [
                                { symbol: 'ROKU', name: 'Roku Inc.' },
                                { symbol: 'PLTR', name: 'Palantir Technologies' },
                                { symbol: 'SNAP', name: 'Snap Inc.' }
                            ];
                        }
                    }

                    const symbolNames = symbols.map(s => s.symbol).join(', ');
                    this.showToast(`📈 Adding symbols based on your preferences: ${symbolNames}...`, 'success');
                    this.appCallbacks.setSelectedSymbols?.(symbols);
                },
                delay: 2000
            },
            {
                id: 'set-wallet',
                name: 'Set Wallet Amount',
                description: 'Configuring trading capital',
                action: async () => {
                    let walletAmount = '25000';
                    let message = '💰 Setting wallet amount to $25,000 for diversified portfolio...';
                    
                    // Adapt wallet amount based on flow prompt
                    if (this.flowPrompt.prompt) {
                        const prompt = this.flowPrompt.prompt.toLowerCase();
                        // Look for patterns like "$250", "250 dollar", "250 dollars", etc.
                        const dollarMatch = prompt.match(/\$(\d+)/) || prompt.match(/(\d+)\s*dollars?/);
                        if (dollarMatch) {
                            walletAmount = dollarMatch[1];
                            message = `💰 Setting wallet amount to $${parseInt(walletAmount).toLocaleString()} based on your guidance...`;
                        } else if (prompt.includes('small') || prompt.includes('beginner')) {
                            walletAmount = '10000';
                            message = '💰 Setting wallet amount to $10,000 for conservative start...';
                        } else if (prompt.includes('large') || prompt.includes('professional')) {
                            walletAmount = '50000';
                            message = '💰 Setting wallet amount to $50,000 for professional trading...';
                        }
                    }
                    
                    this.showToast(message, 'info');
                    this.appCallbacks.setWalletAmount?.(walletAmount);
                },
                delay: 1500
            },
            {
                id: 'select-indicators',
                name: 'Select Technical Indicators',
                description: 'Choosing optimal indicators',
                action: async () => {
                    const indicators = ['SMA', 'EMA', 'RSI', 'MACD', 'BollingerBands'];
                    this.showToast('🔧 Selecting powerful technical indicators: SMA, EMA, RSI, MACD, Bollinger Bands...', 'info');
                    this.appCallbacks.setSelectedIndicators?.(indicators);
                },
                delay: 2000
            },
            {
                id: 'set-timeframe',
                name: 'Set Analysis Timeframe',
                description: 'Optimizing timeframe for analysis',
                action: async () => {
                    this.showToast('⏱️ Setting timeframe to 1 Month for comprehensive trend analysis...', 'info');
                    this.appCallbacks.setSelectedTimeframe?.('1M');
                },
                delay: 1500
            },
            {
                id: 'trigger-analysis',
                name: 'Execute Analysis',
                description: 'Running AI-powered market analysis',
                action: async () => {
                    this.showToast('🤖 Launching Gemini AI analysis... This may take a moment...', 'success', 5000);
                    this.appCallbacks.handleAnalyze?.();
                },
                delay: 2000
            },
            {
                id: 'completion',
                name: 'ProFlow Complete',
                description: 'Automation sequence finished',
                action: async () => {
                    this.showToast('✅ ProFlow automation complete! Your portfolio analysis is running...', 'success', 4000);
                },
                delay: 1000
            }
        ];
    }

    async startProFlow() {
        if (this.isRunning) {
            this.showToast('⚠️ ProFlow is already running!', 'warning');
            return;
        }

        this.isRunning = true;
        this.currentStep = 0;
        this.isPaused = false;

        const modeText = this.mode === 'auto' ? 'Auto' : 'Manual';
        this.showToast(`🎯 ProFlow ${modeText} mode initialized! Starting intelligent automation sequence...`, 'info', 3000);

        for (let i = 0; i < this.steps.length; i++) {
            if (!this.isRunning) break;

            this.currentStep = i;
            const step = this.steps[i];

            try {
                await step.action();

                // In manual mode, pause after each step (except the last one)
                if (this.mode === 'manual' && i < this.steps.length - 1) {
                    this.isPaused = true;
                    this.notifyStatusChange();
                    this.showToast(`⏸️ Step "${step.name}" complete. Click Continue to proceed to next step.`, 'info', 6000);

                    // Wait for user confirmation
                    await new Promise<void>(resolve => {
                        this.confirmationCallback = resolve;
                    });
                }

                // In auto mode, use the original delay
                if (this.mode === 'auto' && step.delay && i < this.steps.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, step.delay));
                }
            } catch (error) {
                console.error(`ProFlow step ${step.id} failed:`, error);
                this.showToast(`❌ Step "${step.name}" failed. Continuing...`, 'error');
            }
        }

        this.isRunning = false;
        this.currentStep = 0;
        this.isPaused = false;
        this.notifyStatusChange();
    }

    stopProFlow() {
        if (!this.isRunning) {
            this.showToast('⚠️ ProFlow is not currently running!', 'warning');
            return;
        }

        this.isRunning = false;
        this.isPaused = false;
        this.notifyStatusChange();
        this.showToast('🛑 ProFlow automation stopped by user.', 'info');
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            currentStep: this.currentStep,
            totalSteps: this.steps.length,
            currentStepName: this.steps[this.currentStep]?.name || 'Idle',
            mode: this.mode,
            isPaused: this.isPaused,
            flowPrompt: this.flowPrompt
        };
    }

    // Predefined automation scenarios
    async runQuickDemo() {
        const quickSteps = this.steps.slice(0, 4); // First 4 steps only
        this.showToast('⚡ Running Quick Demo mode...', 'info');

        for (const step of quickSteps) {
            await step.action();
            await new Promise(resolve => setTimeout(resolve, 800));
        }
    }

    async runAdvancedAnalysis() {
        this.showToast('🧠 Running Advanced Analysis mode...', 'info');

        // Set advanced parameters
        this.appCallbacks.setSelectedIndicators?.(['SMA', 'EMA', 'RSI', 'MACD', 'BollingerBands', 'StochasticOscillator', 'ADX']);
        this.appCallbacks.setWalletAmount?.('50000');
        this.appCallbacks.setSelectedTimeframe?.('3M');

        await new Promise(resolve => setTimeout(resolve, 1000));
        this.appCallbacks.handleAnalyze?.();
        this.showToast('📊 Advanced analysis initiated with comprehensive indicators!', 'success');
    }
}

export const proFlowService = new ProFlowService();