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

export class ProFlowService {
    private isRunning = false;
    private currentStep = 0;
    private steps: ProFlowStep[] = [];
    private mode: ProFlowMode = 'auto';
    private isPaused = false;
    private toastCallback?: (toast: ProFlowToast) => void;
    private confirmationCallback?: () => void;
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

    setAppCallbacks(callbacks: typeof this.appCallbacks) {
        this.appCallbacks = callbacks;
    }

    setMode(mode: ProFlowMode) {
        this.mode = mode;
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
            this.confirmationCallback();
        }
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
                    this.showToast('🚀 ProFlow activated! Preparing to demonstrate Signatex capabilities...', 'info', 4000);
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
                    const symbols = [
                        { symbol: 'AAPL', name: 'Apple Inc.' },
                        { symbol: 'TSLA', name: 'Tesla, Inc.' },
                        { symbol: 'MSFT', name: 'Microsoft Corporation' }
                    ];
                    this.showToast('📈 Adding popular tech stocks: AAPL, TSLA, MSFT...', 'success');
                    this.appCallbacks.setSelectedSymbols?.(symbols);
                },
                delay: 2000
            },
            {
                id: 'set-wallet',
                name: 'Set Wallet Amount',
                description: 'Configuring trading capital',
                action: async () => {
                    this.showToast('💰 Setting wallet amount to $25,000 for diversified portfolio...', 'info');
                    this.appCallbacks.setWalletAmount?.('25000');
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
    }

    stopProFlow() {
        if (!this.isRunning) {
            this.showToast('⚠️ ProFlow is not currently running!', 'warning');
            return;
        }

        this.isRunning = false;
        this.isPaused = false;
        this.showToast('🛑 ProFlow automation stopped by user.', 'info');
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            currentStep: this.currentStep,
            totalSteps: this.steps.length,
            currentStepName: this.steps[this.currentStep]?.name || 'Idle',
            mode: this.mode,
            isPaused: this.isPaused
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