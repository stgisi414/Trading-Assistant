typescript
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GoogleGenAI } from "@google/genai";
import { ttsService } from '../services/ttsService.ts';
import { MarketType } from '../types.ts';

interface ChatMessage {
    id: string;
    type: 'user' | 'bot';
    content: string;
    timestamp: Date;
}

interface SignatexChatbotProps {
    isOpen: boolean;
    onClose: () => void;
    currentInputs?: {
        selectedSymbols: string[];
        walletAmount: string;
        selectedIndicators: string[];
        selectedTimeframe: string;
        selectedMarketType: string;
        selectedNonTechnicalIndicators?: string[];
        includeOptionsAnalysis?: boolean;
        includeCallOptions?: boolean;
        includePutOptions?: boolean;
        includeOrderAnalysis?: boolean;
        startDate?: string;
        endDate?: string;
    };
    analysisResults?: any[];
    profitMaxResult?: any;
    proFlowStatus?: {
        isRunning: boolean;
        currentStep: number;
        totalSteps: number;
        currentStepName: string;
        mode: string;
        isPaused: boolean;
    };
    onUpdateInputs?: (updates: any) => void;
}

// Gemini AI instance
let ai: GoogleGenAI | null = null;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const SignatexChatbot: React.FC<SignatexChatbotProps> = ({ 
    isOpen, 
    onClose, 
    currentInputs,
    analysisResults,
    profitMaxResult,
    proFlowStatus,
    onUpdateInputs
}) => {
    // Load conversation history from localStorage
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        const savedMessages = localStorage.getItem('signatex_chat_history');
        if (savedMessages) {
            try {
                return JSON.parse(savedMessages);
            } catch (error) {
                console.error('Failed to parse chat history:', error);
            }
        }

        return [
            {
                id: '1',
                type: 'bot',
                content: `# 🤖 Hey there! I'm your Signatex AI Assistant! 👋✨

I'm powered by **Gemini AI** 🧠 and deeply integrated with all Signatex features. I can help you with natural language commands and intelligent trading suggestions!

${ttsService.isAvailable() ? 
    '🔊 **Voice-Enabled**: Click the play button on my messages to hear them spoken aloud with Google Text-to-Speech! Perfect for hands-free learning while you focus on charts. 🎧✨' : 
    ''} 

---

## 🧠 What I can help you with:

### 📊 **Trading Setup & Strategy**
- 🎯 Choose optimal indicators based on your experience level
- 💰 Suggest wallet amounts and position sizing strategies  
- ⏰ Recommend timeframes for different trading styles
- 🔧 Update your input settings through conversation
- 📈 Explain analysis results and market patterns

### 🚀 **Advanced Features**
- 🎛️ Guide you through **ProfitMax** optimization
- ⚡ Walk you through **ProFlow** automation
- 📰 Analyze market news and sentiment
- 🎨 Generate trading insights with visual aids

---

### 💬 Try these natural commands:

> 💡 **For Beginners:**
> - *"I'm a beginner, what indicators should I use?"*
> - *"Explain RSI in simple terms"*
> - *"What's a good starting wallet amount?"*

> 💰 **Financial Management:**
> - *"Set my wallet to $25,000"*
> - *"Calculate position size for 2% risk"*

> 📊 **Symbol & Analysis:**
> - *"Add AAPL and TSLA to my symbols"*
> - *"Analyze the current market sentiment"*
> - *"What patterns do you see in my results?"*

> 🧠 **Advanced Analysis:**
> - *"Add news sentiment analysis"*
> - *"Include social media sentiment"*
> - *"Enable options analysis"*
> - *"Include stop loss analysis"*

> ⏱️ **Timeframes & Styles:**
> - *"Switch to 1-day timeframe"*  
> - *"What's the best setup for day trading?"*
> - *"Configure me for swing trading"*

---

### 🎯 **Ready to optimize your trading?** 
What would you like to explore today? 🚀📈`,
                timestamp: new Date()
            }
        ];
    });
    const [inputMessage, setInputMessage] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null);
    const [audioCache, setAudioCache] = useState<Map<string, string>>(new Map());
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentAudioRef = useRef<HTMLAudioElement | null>(null);
    const recognitionRef = useRef<any>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Initialize speech recognition
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
            setSpeechSupported(true);
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputMessage(transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    // Save conversation history to localStorage
    useEffect(() => {
        localStorage.setItem('signatex_chat_history', JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Parse natural language commands and extract actions
    const parseUserCommands = (message: string) => {
        const lowerMessage = message.toLowerCase();
        const actions: any[] = [];

        // Wallet amount changes
        const walletMatch = message.match(/(?:set|change|update).*?wallet.*?(?:to|\$)\s*([0-9,]+)/i);
        if (walletMatch) {
            const amount = walletMatch[1].replace(/,/g, '');
            actions.push({
                type: 'updateWallet',
                value: amount,
                description: `Set wallet amount to $${parseInt(amount).toLocaleString()}`
            });
        }

        // Symbol detection for add commands
        if (lowerMessage.includes('add') || lowerMessage.includes('include')) {
            let symbols: string[] = [];

            // Direct symbol matches (GOOG, MSFT, AAPL, etc.)
            const directSymbolMatches = message.match(/\b([A-Z]{2,5})\b/g);
            if (directSymbolMatches) {
                symbols = directSymbolMatches.filter(s => s.length >= 2 && s.length <= 5);
            }

            if (lowerMessage.includes('energy')) {
                // From constants.ts, we have energy symbols
                const energySymbols = MARKET_OPTIONS.COMMODITIES?.find(c => c.value === 'ENERGY')?.symbols?.map(s => s.symbol) || [];
                symbols.push(...energySymbols);
            }

            if (lowerMessage.includes('ai stocks')) {
                symbols.push('NVDA', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA');
            }

            if (symbols.length > 0) {
                // Check if the current market is correct
                if (currentInputs?.selectedMarketType !== MarketType.STOCKS && (lowerMessage.includes('ai stocks') || lowerMessage.includes('tech stocks'))) {
                     actions.push({
                        type: 'marketTypeError',
                        value: 'STOCKS',
                        currentMarketType: currentInputs?.selectedMarketType
                    });
                } else if (currentInputs?.selectedMarketType !== MarketType.COMMODITIES && lowerMessage.includes('energy')) {
                     actions.push({
                        type: 'marketTypeError',
                        value: 'COMMODITIES',
                        currentMarketType: currentInputs?.selectedMarketType
                    });
                }
                else {
                    actions.push({
                        type: 'addSymbols',
                        value: [...new Set(symbols)], // Remove duplicates
                        description: `Add symbols: ${[...new Set(symbols)].join(', ')}`
                    });
                }
            }
        }

        // Timeframe changes
        const timeframeMatch = message.match(/(?:set|change|switch).*?(?:timeframe|period).*?(?:to\s+)?([15]?[mhd]|[1-9][mhd]|1[mh]|[1-5]y|custom)/i);
        if (timeframeMatch) {
            actions.push({
                type: 'updateTimeframe',
                value: timeframeMatch[1],
                description: `Change timeframe to ${timeframeMatch[1]}`
            });
        }

        // Indicator suggestions based on experience level
        if (lowerMessage.includes('beginner') || lowerMessage.includes('new') || lowerMessage.includes('starting')) {
            actions.push({
                type: 'suggestBeginnerIndicators',
                value: ['SMA', 'RSI', 'Volume'],
                description: 'Suggest beginner-friendly indicators'
            });
        }

        if (lowerMessage.includes('advanced') || lowerMessage.includes('expert') || lowerMessage.includes('professional')) {
            actions.push({
                type: 'suggestAdvancedIndicators',
                value: ['MACD', 'BollingerBands', 'StochasticOscillator', 'FibonacciRetracement'],
                description: 'Suggest advanced indicators'
            });
        }

        // Market type switching
        if (lowerMessage.includes('switch to crypto') || lowerMessage.includes('change to crypto') || 
            (lowerMessage.includes('crypto') && (lowerMessage.includes('market') || lowerMessage.includes('add')))) {
            actions.push({
                type: 'switchToCrypto',
                value: 'CRYPTO',
                description: 'Switch to crypto market'
            });
        }

        if (lowerMessage.includes('switch to stocks') || lowerMessage.includes('change to stocks') || 
            (lowerMessage.includes('stocks market') && (lowerMessage.includes('ai stocks') || lowerMessage.includes('add')))) {
            actions.push({
                type: 'switchToStocks',
                value: 'STOCKS',
                description: 'Switch to stocks market'
            });
        }

        // Crypto symbol additions
        if (lowerMessage.includes('ethereum') || lowerMessage.includes('eth')) {
            actions.push({
                type: 'addCryptoSymbols',
                value: ['ETH'],
                description: 'Add Ethereum (ETH)'
            });
        }

        if (lowerMessage.includes('bitcoin') || lowerMessage.includes('btc')) {
            actions.push({
                type: 'addCryptoSymbols',
                value: ['BTC'],
                description: 'Add Bitcoin (BTC)'
            });
        }

        if (lowerMessage.includes('major crypto') || lowerMessage.includes('major cryptocurrencies')) {
            actions.push({
                type: 'addCryptoSymbols',
                value: ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'],
                description: 'Add major cryptocurrencies'
            });
        }

        // Day trading setup
        if (lowerMessage.includes('day trading') || lowerMessage.includes('scalping')) {
            actions.push({
                type: 'dayTradingSetup',
                value: {
                    timeframe: '15m',
                    indicators: ['EMA', 'RSI', 'Volume', 'VWAP'],
                    description: 'Configure for day trading'
                }
            });
        }

        // Swing trading setup
        if (lowerMessage.includes('swing trading') || lowerMessage.includes('position trading')) {
            actions.push({
                type: 'swingTradingSetup',
                value: {
                    timeframe: '1d',
                    indicators: ['SMA', 'MACD', 'RSI', 'BollingerBands'],
                    description: 'Configure for swing trading'
                }
            });
        }

        return actions;
    };

    // Execute parsed actions
    const executeActions = (actions: any[]) => {
        if (!onUpdateInputs) return;

        const updates: any = {};
        let executed = false;

        actions.forEach(action => {
            switch (action.type) {
                case 'updateWallet':
                    updates.walletAmount = action.value;
                    executed = true;
                    break;
                case 'addSymbols':
                    // Convert symbol strings to FmpSearchResult objects and add them
                    if (onUpdateInputs) {
                        console.log('🤖 Chatbot: Processing addSymbols action', action);

                        const symbolNames: Record<string, string> = {
                            'NVDA': 'NVIDIA Corporation',
                            'GOOGL': 'Alphabet Inc.',
                            'GOOG': 'Alphabet Inc. Class C',
                            'MSFT': 'Microsoft Corporation',
                            'AMZN': 'Amazon.com Inc.',
                            'META': 'Meta Platforms Inc.',
                            'TSLA': 'Tesla Inc.',
                            'AAPL': 'Apple Inc.',
                            'NFLX': 'Netflix Inc.',
                            'CRM': 'Salesforce Inc.',
                            'ORCL': 'Oracle Corporation',
                            'IBM': 'International Business Machines',
                            'AMD': 'Advanced Micro Devices',
                            'INTC': 'Intel Corporation',
                            'ADBE': 'Adobe Inc.',
                            'NOW': 'ServiceNow Inc.',
                            'PLTR': 'Palantir Technologies',
                            'AI': 'C3.ai Inc.',
                            'SNOW': 'Snowflake Inc.',
                            'XOM': 'Exxon Mobil Corporation',
                            'CVX': 'Chevron Corporation',
                            'BP': 'BP plc',
                            'SHEL': 'Shell plc',
                            'COP': 'ConocoPhillips',
                            'EOG': 'EOG Resources Inc.',
                            'SLB': 'Schlumberger Limited',
                            'MPC': 'Marathon Petroleum Corporation'
                        };

                        const symbolsToAdd = action.value.map((symbol: string) => ({
                            symbol: symbol,
                            name: symbolNames[symbol] || `${symbol} Corporation`
                        }));

                        console.log('🤖 Chatbot: Symbols to add:', symbolsToAdd);
                        console.log('🤖 Chatbot: Calling onUpdateInputs with addSymbols');

                        onUpdateInputs({ addSymbols: symbolsToAdd });
                        executed = true;

                        console.log('🤖 Chatbot: addSymbols action executed successfully');
                    } else {
                        console.error('🤖 Chatbot: onUpdateInputs not available for addSymbols');
                    }
                    break;
                case 'marketTypeError':
                    // Don't execute - this is an error case that will be handled in the response
                    executed = false;
                    break;
                case 'switchToCrypto':
                    if (onUpdateInputs) {
                        onUpdateInputs({ 
                            selectedMarketType: 'CRYPTO',
                            selectedMarket: 'Major'
                        });
                        executed = true;
                    }
                    break;
                case 'switchToStocks':
                    if (onUpdateInputs) {
                        onUpdateInputs({ 
                            selectedMarketType: 'STOCKS',
                            selectedMarket: 'US'
                        });
                        executed = true;
                    }
                    break;
                case 'addCryptoSymbols':
                    if (onUpdateInputs) {
                        const cryptoNames: Record<string, string> = {
                            'BTC': 'Bitcoin',
                            'ETH': 'Ethereum',
                            'BNB': 'Binance Coin',
                            'SOL': 'Solana',
                            'XRP': 'XRP',
                            'ADA': 'Cardano',
                            'AVAX': 'Avalanche',
                            'DOT': 'Polkadot',
                            'MATIC': 'Polygon',
                            'UNI': 'Uniswap'
                        };

                        const symbolsToAdd = action.value.map((symbol: string) => ({
                            symbol: symbol,
                            name: cryptoNames[symbol] || `${symbol} Token`
                        }));

                        console.log('🤖 Chatbot: Adding crypto symbols:', symbolsToAdd);
                        onUpdateInputs({ addSymbols: symbolsToAdd });
                        executed = true;
                    }
                    break;
                case 'updateTimeframe':
                    updates.selectedTimeframe = action.value;
                    executed = true;
                    break;
                case 'suggestBeginnerIndicators':
                case 'suggestAdvancedIndicators':
                    updates.selectedIndicators = action.value;
                    executed = true;
                    break;
                case 'dayTradingSetup':
                case 'swingTradingSetup':
                    updates.selectedTimeframe = action.value.timeframe;
                    updates.selectedIndicators = action.value.indicators;
                    executed = true;
                    break;
            }
        });

        if (executed) {
            onUpdateInputs(updates);
        }

        return executed;
    };

    const generateGeminiResponse = async (userMessage: string, actions: any[]): Promise<string> => {
        if (!ai) {
            return generateFallbackResponse(userMessage, actions);
        }

        try {
            // Check for market type validation errors first
            const marketTypeError = actions.find(a => a.type === 'marketTypeError');
            if (marketTypeError) {
                return generateMarketTypeErrorResponse(marketTypeError, userMessage);
            }

            // Create comprehensive context for Gemini
            const context = {
                userMessage,
                currentInputs,
                analysisResults: analysisResults?.length || 0,
                hasResults: analysisResults && analysisResults.length > 0,
                profitMaxActive: !!profitMaxResult,
                proFlowRunning: proFlowStatus?.isRunning || false,
                actionsDetected: actions,
                conversationHistory: messages.slice(-3),
                selectedNonTechnicalIndicators: currentInputs?.selectedNonTechnicalIndicators,
                includeOptionsAnalysis: currentInputs?.includeOptionsAnalysis,
                includeOrderAnalysis: currentInputs?.includeOrderAnalysis
            };

            const prompt = `🤖 You are the Signatex AI Trading Assistant, powered by Gemini AI. You are integrated into a comprehensive trading analysis platform called Signatex.

📊 CURRENT USER CONTEXT:
- 🎯 Selected Symbols: ${currentInputs?.selectedSymbols?.join(', ') || 'None'}
- 💰 Wallet Amount: $${currentInputs?.walletAmount || '0'}
- 📈 Active Indicators: ${currentInputs?.selectedIndicators?.join(', ') || 'None'}
- ⏰ Timeframe: ${currentInputs?.selectedTimeframe || 'Not set'}
- 🏪 Market Type: ${currentInputs?.selectedMarketType || 'Not set'}
- 📰 Non-Technical Indicators: ${currentInputs?.selectedNonTechnicalIndicators?.join(', ') || 'None'}
- ⚙️ Options Analysis: ${currentInputs?.includeOptionsAnalysis ? 'Enabled ✅' : 'Disabled ❌'}
- 🛑 Stop Limit Order Check: ${currentInputs?.includeOrderAnalysis ? 'Enabled ✅' : 'Disabled ❌'}
- 📊 Analysis Results: ${context.hasResults ? 'Available ✅' : 'None ❌'}
- 🎛️ ProfitMax Status: ${context.profitMaxActive ? 'Optimized ✅' : 'Not run ⏳'}
- ⚡ ProFlow Status: ${context.proFlowRunning ? 'Running 🔄' : 'Idle 😴'}

🎯 DETECTED ACTIONS FROM USER MESSAGE: ${JSON.stringify(actions)}

💬 USER MESSAGE: "${userMessage}"

📋 RESPONSE INSTRUCTIONS:
1. 🗣️ Respond naturally and conversationally as a trading expert
2. ✅ If actions were detected and executed, acknowledge them specifically with enthusiasm
3. 🎓 Provide educational trading insights relevant to the user's question
4. 🔗 Reference the user's current setup when giving advice
5. 💪 Be helpful, knowledgeable, and encouraging
6. 😊 Use emojis frequently but appropriately to make responses engaging
7. 📚 Format responses using markdown with headers, lists, and emphasis
8. 🔥 For beginners: recommend SMA, RSI, and Volume with clear explanations
9. 🚀 For advanced setups: suggest MACD, Bollinger Bands, Stochastic, etc.
10. 💡 Always explain WHY you're making specific recommendations
11. 📝 Keep responses focused but informative (aim for 200-400 words)
12. 🎨 Use sections with headers (##) and bullet points for clarity
13. 💫 End with an encouraging question or call-to-action

🎯 Generate a helpful, personalized response with plenty of emojis and markdown formatting:`;

            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: prompt,
                config: {
                    temperature: 0.7,
                    maxOutputTokens: 2048
                }
            });

            return response.text || generateFallbackResponse(userMessage, actions);

        } catch (error) {
            console.error('Gemini API error:', error);
            return generateFallbackResponse(userMessage, actions);
        }
    };

    const generateMarketTypeErrorResponse = (errorAction: any, userMessage: string): string => {
        const currentMarket = errorAction.currentMarketType;
        const targetAssetType = errorAction.value;

        return `## ❌ Market Type Mismatch! 

### 🚨 **Cannot Add ${targetAssetType.toUpperCase()} Symbols**

I detected your request to add **${targetAssetType}** symbols, but your current market type is set to **${currentMarket}**.

---

### 🔧 **Here's How to Fix This:**

#### **Option 1: Switch to Stocks Market** ✅
1. 📊 Change your **Market Type** to **"US Markets"** 
2. 🏪 Set **Market** to **"United States (NASDAQ/NYSE)"**
3. 📈 Then I can add those AI stocks for you!

#### **Option 2: Choose ${currentMarket} Assets** 📊
${currentMarket === 'COMMODITIES' ? 
    `Instead of stocks, try saying:
- 🥇 *"Add gold and silver to my symbols"*
- ⚡ *"Include energy commodities like crude oil"*
- 🌾 *"Add agricultural commodities"*` :
currentMarket === 'CRYPTO' ?
    `Instead of stocks, try saying:
- 🪙 *"Add major cryptocurrencies"*
- 🔥 *"Include Bitcoin and Ethereum"*
- 🚀 *"Add DeFi tokens"*` :
currentMarket === 'FOREX' ?
    `Instead of stocks, try saying:
- 💱 *"Add major currency pairs"*
- 🌍 *"Include EUR/USD and GBP/USD"*
- 📈 *"Add exotic pairs"*` :
    `Please select appropriate assets for your chosen market type.`}

---

### 💡 **Quick Fix Command:**
Just say: **"Switch to stocks market and add AI stocks"** and I'll handle both steps! 🚀

**Would you like me to help you switch markets or choose different assets? 🤝**`;
    };

    const generateFallbackResponse = (userMessage: string, actions: any[]): string => {
        const lowerMessage = userMessage.toLowerCase();

        // Check for market type validation errors first
        const marketTypeError = actions.find(a => a.type === 'marketTypeError');
        if (marketTypeError) {
            return generateMarketTypeErrorResponse(marketTypeError, userMessage);
        }

        // If actions were executed, give a concise acknowledgment
        if (actions.length > 0) {
            const actionDescriptions = actions.map(a => a.description).join(', ');
            const hasSymbolAddition = actions.some(a => a.type === 'addSymbols');

            if (hasSymbolAddition) {
                return `## ✅ Symbols Added Successfully! 🎉

> 🔧 **${actionDescriptions}**

Your symbols should now appear in the **Asset Symbols** section above. You can now click **"Analyze X Asset(s)"** to start your analysis.

**Ready to analyze? 📊**`;
            }

            return `## ✅ Configuration Updated! 🎉

> 🔧 **${actionDescriptions}**

Your settings have been applied successfully!

**What would you like to do next? 🚀**`;
        }

        // Provide contextual responses based on message content
        if (lowerMessage.includes('beginner') || lowerMessage.includes('new') || lowerMessage.includes('starting')) {
            return `## 🎯 Perfect! Welcome to Advanced Trading! 

### 🌟 **The Beginner's Power Quartet**

For someone just starting, I recommend these **four essential features**:

#### 1. 📈 **SMA + RSI + Volume** (The Classic Trio)
- 🎯 **Purpose**: Trend direction, momentum, and confirmation
- 💡 **Why it's great**: Simple, reliable, and works across all markets
- 🔧 **How to use**: SMA for trend, RSI for timing, Volume for strength

#### 2. 📰 **News Sentiment Analysis**
- 🎯 **Purpose**: Understand market-moving events
- 💡 **Why it's great**: Real-time news impact on your symbols
- 🔧 **How to use**: Positive news = potential uptrend, negative = downtrend

#### 3. 🏢 **Company Profile Analysis**
- 🎯 **Purpose**: Know what you're trading
- 💡 **Why it's great**: Fundamental analysis made simple
- 🔧 **How to use**: Strong companies = better investment candidates

#### 4. 🔍 **Pattern Recognition**
- 🎯 **Purpose**: Identify chart patterns automatically
- 💡 **Why it's great**: AI spots patterns you might miss
- 🔧 **How to use**: Follow pattern implications for entry/exit points

---

### 🤝 **Want me to set this up for you?** 
Just say *"configure beginner setup"* and I'll enable all these features automatically! 

### 🚀 **Why This Combo Works:**
You get **technical + fundamental + sentiment + pattern analysis** - a complete trading toolkit!

**Ready to start your advanced trading journey? 🎮💰**`;
        }

        if (lowerMessage.includes('indicator')) {
            return `## 📚 Let's Talk Indicators! 

### 🔧 **Your Current Setup:**
> ${currentInputs?.selectedIndicators?.length ? 
    `📊 **Technical:** ${currentInputs.selectedIndicators.join(', ')}` : 
    '❌ **No technical indicators selected yet**'}

> ${currentInputs?.selectedNonTechnicalIndicators?.length ? 
    `🧠 **Advanced:** ${currentInputs.selectedNonTechnicalIndicators.join(', ')}` : 
    '❌ **No advanced analysis selected yet**'}

---

### 🎯 **Complete Indicator Categories:**

#### 📈 **Technical Indicators (20+ Available)**
| Category | Indicators | Best For |
|----------|------------|----------|
| 📊 **Trend** | SMA, EMA, MACD, Parabolic SAR | Following trends |
| ⚡ **Momentum** | RSI, Stochastic, Williams %R, CCI | Timing entries |
| 📈 **Volatility** | Bollinger Bands, ATR, Keltner | Risk assessment |
| 📊 **Volume** | Volume, VWAP, OBV | Confirming moves |
| 🔮 **Advanced** | Fibonacci, Ichimoku, Elliott Wave | Pro trading |

#### 🧠 **Advanced Analysis**
- 📰 **News Sentiment** - Real-time market news analysis
- 📱 **Social Media Sentiment** - Twitter/Reddit buzz tracking
- 🏢 **Company Profiles** - Fundamental company data
- 🔍 **Pattern Recognition** - AI-powered chart patterns
- 🎯 **Options Analysis** - Options flow and recommendations
- 📊 **Open Interest** - Options market sentiment

---

### 💭 **What's your trading style?**
- 🏃‍♂️ **Day trader?** → EMA + RSI + VWAP + News
- 🏋️‍♂️ **Swing trader?** → SMA + MACD + Patterns + Company Profiles  
- 📚 **Complete beginner?** → SMA + RSI + Volume + News
- 🚀 **Advanced trader?** → Full suite with Options + Social Sentiment

**I'll recommend the perfect combination for YOU! 🎯✨**`;
        }

        if (lowerMessage.includes('options') || lowerMessage.includes('option')) {
            return `## 🎯 Options Analysis - Your Institutional Edge! 

### 📊 **What Signatex Options Analysis Provides:**

#### 🎯 **Smart Recommendations**
- 📈 **Call Options**: Optimal strike prices and expiration dates
- 📉 **Put Options**: Best hedging and profit opportunities  
- 💰 **Premium Analysis**: Bid/ask spreads and fair value
- 🎲 **Risk Assessment**: Greeks analysis for each position

#### 📊 **Open Interest Insights**
- 🔍 **Institutional Flow**: Where big money is moving
- 📈 **Sentiment Indicators**: Bullish vs bearish positioning
- ⚡ **Volume Spikes**: Unusual options activity alerts
- 🎯 **Support/Resistance**: Key levels from options data

---

### 🚀 **How to Enable:**
Just say *"Enable options analysis"* and I'll turn on:
- ✅ Call option recommendations
- ✅ Put option analysis  
- ✅ Open interest tracking
- ✅ Institutional sentiment

### 💡 **Pro Tip:**
Options data often predicts stock movements before they happen. Institutional traders use options to position before big moves!

**Want to see what the big players are doing with your symbols? 🎯📊**`;
        }

        if (lowerMessage.includes('news') || lowerMessage.includes('sentiment')) {
            return `## 📰 News & Sentiment Analysis - Market Pulse! 

### 🔍 **Real-Time Market Intelligence:**

#### 📰 **News Sentiment Analysis**
- 🌍 **Global News Sources**: Reuters, Bloomberg, AP, and more
- 🤖 **AI Sentiment Scoring**: Positive, negative, neutral with confidence
- ⚡ **Breaking News Alerts**: Real-time market-moving events
- 📊 **Impact Assessment**: How news affects your specific symbols

#### 📱 **Social Media Sentiment**
- 🐦 **Twitter Analysis**: Real-time social buzz and sentiment
- 📱 **Reddit Tracking**: Community sentiment and discussions
- 🔥 **Viral Content**: Trending topics affecting your stocks
- 📈 **Sentiment Trends**: Social sentiment momentum tracking

---

### 🎯 **Why This Matters:**
- 📈 **Early Detection**: Spot sentiment shifts before price moves
- 🚨 **Risk Management**: Avoid trading against negative sentiment
- 💡 **Opportunity Finding**: Find undervalued assets with improving sentiment
- 📊 **Confirmation**: Validate technical analysis with fundamental news

### 🚀 **How to Enable:**
- *"Enable news sentiment analysis"* → Real-time news tracking
- *"Include social media sentiment"* → Twitter/Reddit analysis
- *"Add sentiment analysis"* → Both news and social combined

**Ready to read the market's mind? 🧠📰**`;
        }

        if (lowerMessage.includes('pattern') || lowerMessage.includes('chart')) {
            return `## 🔍 AI Pattern Recognition - Your Chart Analyst! 

### 🎯 **Advanced Pattern Detection:**

#### 📊 **Supported Patterns**
- 📈 **Head & Shoulders**: Top and bottom formations
- 🔄 **Double Tops/Bottoms**: Classic reversal patterns
- 📈 **Triangle Patterns**: Ascending, descending, symmetrical
- 🌊 **Cup & Handle**: Bullish continuation patterns
- ⚡ **Flag & Pennant**: Short-term continuation signals

#### 🤖 **AI Analysis Features**
- 🎯 **Confidence Scoring**: 0-100% pattern reliability
- 📊 **Trading Implications**: Entry/exit recommendations
- 🎯 **Target Prices**: Projected price movements
- 📈 **Key Levels**: Support, resistance, necklines
- ⏰ **Timeframe Analysis**: Pattern validity across timeframes

---

### 💡 **Why Pattern Recognition Matters:**
- 🎯 **Objective Analysis**: Remove emotional bias from trading
- 📊 **Historical Success**: Patterns have statistical edge
- ⚡ **Early Detection**: Spot patterns before completion
- 🎮 **Game Changer**: What took years to learn, AI does instantly

### 🚀 **How to Enable:**
Just say *"Enable pattern recognition"* and I'll activate:
- ✅ Real-time pattern scanning
- ✅ Confidence scoring
- ✅ Trading recommendations
- ✅ Key level identification

**Want AI to be your personal chart analyst? 🤖📊**`;
        }

        return `## 💬 I'm Your Complete Trading Assistant! 

### 🤖 **Full Feature Arsenal:**

#### 📊 **Core Trading Tools:**
- 🎯 **20+ Technical Indicators** (SMA, RSI, MACD, Bollinger Bands, etc.)
- 💰 **Smart Position Sizing** and wallet management
- ⏰ **Multi-Timeframe Analysis** (1m to 1y)
- 🌍 **4 Major Markets** (Stocks, Crypto, Commodities, Forex)

#### 🧠 **Advanced Analytics:**
- 📰 **News Sentiment Analysis** - Real-time market news impact
- 📱 **Social Media Sentiment** - Twitter/Reddit buzz tracking
- 🏢 **Company Profiles** - CEO, industry, fundamentals
- 🔍 **AI Pattern Recognition** - Chart patterns with confidence scores
- 🎯 **Options Analysis** - Call/put recommendations with Greeks
- 📊 **Open Interest Analysis** - Institutional options flow

#### ⚡ **Automation & Cloud:**
- 🎛️ **ProfitMax** - AI portfolio optimization
- ⚡ **ProFlow** - Automated trading workflows
- 💾 **Cloud Storage** - Save/sync analysis across devices
- 🔐 **Secure Authentication** - Google/email sign-in

---

### 💡 **Popular Commands:**

> 🔰 **"Configure complete beginner setup"**
> 🎛️ **"Enable all advanced features"**  
> 📊 **"Add news and social sentiment"**
> 💰 **"Set wallet to $100,000"**
> 📈 **"Add tech stocks with options analysis"**
> 🎯 **"Run ProfitMax optimization"**
> ⚡ **"Start ProFlow automation"**

---

### 🎯 **Ready to Master Professional Trading?** 
I have **every tool** you need to trade like a pro! What feature excites you most? 🚀📈✨`;
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString() + '-user',
            type: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsThinking(true);

        // Parse user commands and execute actions
        const actions = parseUserCommands(inputMessage);
        const actionsExecuted = executeActions(actions);// Generate response with Gemini AI
        try {
            const response = await generateGeminiResponse(inputMessage, actions);

            const botMessage: ChatMessage = {
                id: Date.now().toString() + '-bot',
                type: 'bot',
                content: response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Failed to generate response:', error);
            const errorMessage: ChatMessage = {
                id: Date.now().toString() + '-bot',
                type: 'bot',
                content: `I apologize, but I'm having trouble connecting to my AI services right now. However, I can still help you with basic commands and navigation! 

Try asking me about indicators, trading setups, or general trading advice. 🤖`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsThinking(false);
        }
    };

    // TTS Functions
    const synthesizeAndPlayMessage = async (messageId: string, content: string) => {
        if (!ttsService.isAvailable()) {
            console.warn('TTS service not available');
            return;
        }

        try {
            setIsPlayingAudio(messageId);

            // Check cache first
            let audioDataUrl = audioCache.get(messageId);

            if (!audioDataUrl) {
                // Synthesize speech
                audioDataUrl = await ttsService.synthesizeSpeech({
                    text: content,
                    languageCode: 'en-US',
                    voiceName: 'en-US-Studio-O',
                    ssmlGender: 'FEMALE', // Explicitly set supported gender
                    speakingRate: 1.1,
                    pitch: 0.2
                });

                if (audioDataUrl) {
                    // Cache the audio
                    setAudioCache(prev => new Map(prev).set(messageId, audioDataUrl!));
                }
            }

            if (audioDataUrl) {
                // Stop any currently playing audio
                if (currentAudioRef.current) {
                    currentAudioRef.current.pause();
                    currentAudioRef.current = null;
                }

                // Create and play new audio
                const audio = new Audio(audioDataUrl);
                currentAudioRef.current = audio;

                audio.onended = () => {
                    setIsPlayingAudio(null);
                    currentAudioRef.current = null;
                };

                audio.onerror = () => {
                    setIsPlayingAudio(null);
                    currentAudioRef.current = null;
                    console.error('Audio playback failed');
                };

                await audio.play();
            }
        } catch (error) {
            console.error('TTS error:', error);
            setIsPlayingAudio(null);
        }
    };

    const stopAudio = () => {
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current = null;
        }
        setIsPlayingAudio(null);
    };

    // Speech recognition functions
    const startListening = () => {
        if (recognitionRef.current && speechSupported) {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-0 sm:p-4">
            <div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-2xl shadow-2xl w-full h-full sm:h-[80vh] sm:max-w-4xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <img src="https://cdn.hugeicons.com/icons/google-gemini-bulk-rounded.svg" alt="Gemini AI" className="w-5 h-5 sm:w-6 sm:h-6 filter brightness-0 invert" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-1 sm:gap-2 flex-wrap">
                                <span className="signatex-embossed">Signatex Assistant</span>
                                <span className="inline-flex items-center gap-1 px-1 sm:px-2 py-0.5 sm:py-1 text-xs bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-200 rounded-full border dark:border-green-400/30">
                                    <img src="https://cdn.hugeicons.com/icons/ai-cloud-stroke-rounded.svg" className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-500 dark:text-green-300 dark:filter dark:brightness-0 dark:invert" />
                                    <span className="hidden sm:inline">Gemini AI</span>
                                    <img src="https://cdn.hugeicons.com/icons/google-gemini-stroke-rounded.svg" className="w-2.5 h-2.5 sm:hidden text-green-500 dark:text-green-300 dark:filter dark:brightness-0 dark:invert" />
                                </span>
                                {ttsService.isAvailable() && (
                                    <span className="inline-flex items-center gap-1 px-1 sm:px-2 py-0.5 sm:py-1 text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-200 rounded-full border dark:border-purple-400/30">
                                        <img src="https://cdn.hugeicons.com/icons/voice-stroke-rounded.svg" className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-600 dark:text-purple-300 dark:filter dark:brightness-0 dark:invert" />
                                        <span className="hidden sm:inline">TTS Ready</span>
                                    </span>
                                )}
                                {speechSupported && (
                                    <span className="inline-flex items-center gap-1 px-1 sm:px-2 py-0.5 sm:py-1 text-xs bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-200 rounded-full border dark:border-orange-400/30">
                                        <img src="https://cdn.hugeicons.com/icons/mic-01-stroke-rounded.svg" className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-600 dark:text-orange-300 dark:filter dark:brightness-0 dark:invert" />
                                        <span className="hidden sm:inline">Voice Input</span>
                                    </span>
                                )}
                                {proFlowStatus?.isRunning && (
                                    <span className="inline-flex items-center gap-1 px-1 sm:px-2 py-0.5 sm:py-1 text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-200 rounded-full border dark:border-blue-400/30">
                                        <img src="https://cdn.hugeicons.com/icons/workflow-square-09-stroke-rounded.svg" className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-pulse text-blue-600 dark:text-blue-300 dark:filter dark:brightness-0 dark:invert" />
                                        <span className="hidden sm:inline">ProFlow Active</span>
                                    </span>
                                )}
                                {profitMaxResult && (
                                    <span className="inline-flex items-center px-1 sm:px-2 py-0.5 sm:py-1 text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-200 rounded-full border dark:border-purple-400/30">
                                        <img src="https://cdn.hugeicons.com/icons/money-add-02-stroke-rounded.svg" className="w-2.5 h-2.5 sm:hidden text-purple-600 dark:text-purple-300 dark:filter dark:brightness-0 dark:invert" />
                                        <span className="hidden sm:inline">ProfitMax Ready</span>
                                    </span>
                                )}
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                                AI Trading Expert • Natural Language Commands • Live Integration
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <button
                            onClick={() => {
                                setMessages([{
                                    id: '1',
                                    type: 'bot',
                                    content: `# 🔄 Fresh Start! Hey again! 👋✨

## 🧹 **Conversation Cleared Successfully!** 

I'm ready for fresh insights and still fully synced with your Signatex setup! 

### 🤖 **Status Check:**
- ✅ **Gemini AI**: Connected and ready
- 🔗 **Signatex Integration**: Fully synced  
- 📊 **Your Current Setup**: Monitoring live
- 🚀 **Ready to Help**: 100%

---

### 💫 **What would you like to explore today?**

🎯 **Trading strategies?** 📈 **Market analysis?** 🔧 **Setup optimization?** 💰 **Position sizing?**

**I'm here to help you succeed! 🚀💪**`,
                                    timestamp: new Date()
                                }]);
                                localStorage.removeItem('signatex_chat_history');
                            }}
                            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-500 dark:text-gray-300 border dark:border-gray-600"
                            title="Clear conversation"
                        >
                            <img src="https://cdn.hugeicons.com/icons/delete-02-stroke-rounded.svg" className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300 dark:filter dark:brightness-0 dark:invert" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 sm:p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors bg-red-50 dark:bg-red-500/10 border dark:border-red-400/30"
                            title="Close chat"
                        >
                            <img src="https://cdn.hugeicons.com/icons/cancel-01-stroke-rounded.svg" className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 dark:text-red-300 dark:filter dark:brightness-0 dark:invert" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 relative ${
                                    message.type === 'user'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                }`}
                            >
                                {message.type === 'bot' ? (
                                    <div className="relative">
                                        {/* TTS Controls */}
                                        {ttsService.isAvailable() && (
                                            <div className="absolute -top-2 -right-2 flex gap-1">
                                                {isPlayingAudio === message.id ? (
                                                    <button
                                                        onClick={stopAudio}
                                                        className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg transition-colors z-10"
                                                        title="Stop audio"
                                                    >
                                                        <img src="https://cdn.hugeicons.com/icons/stop-stroke-rounded.svg" className="w-3 h-3 filter brightness-0 invert" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => synthesizeAndPlayMessage(message.id, message.content)}
                                                        className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded-full shadow-lg transition-colors z-10"
                                                        title="Play audio"
                                                    >
                                                        <img src="https://cdn.hugeicons.com/icons/play-stroke-rounded.svg" className="w-3 h-3 filter brightness-0 invert" />
                                                    </button>
                                                )}
                                                {audioCache.has(message.id) && (
                                                    <div className="bg-green-500 text-white p-1.5 rounded-full shadow-lg" title="Audio cached">
                                                        <img src="https://cdn.hugeicons.com/icons/tick-02-stroke-rounded.svg" className="w-3 h-3 filter brightness-0 invert" />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown 
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    h1: ({children}) => <h1 className="text-xl font-bold mb-3 text-blue-600 dark:text-blue-400 border-b border-blue-200 dark:border-blue-700 pb-2">{children}</h1>,
                                                    h2: ({children}) => <h2 className="text-lg font-semibold mb-2 text-purple-600 dark:text-purple-400">{children}</h2>,
                                                    h3: ({children}) => <h3 className="text-md font-medium mb-2 text-green-600 dark:text-green-400">{children}</h3>,
                                                    p: ({children}) => <p className="mb-3 leading-relaxed">{children}</p>,
                                                    ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-2 ml-2">{children}</ul>,
                                                    ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-2 ml-2">{children}</ol>,
                                                    li: ({children}) => <li className="text-sm leading-relaxed">{children}</li>,
                                                    strong: ({children}) => <strong className="font-bold text-gray-900 dark:text-white">{children}</strong>,
                                                    em: ({children}) => <em className="italic text-gray-700 dark:text-gray-300">{children}</em>,
                                                    code: ({children}) => <code className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-mono border">{children}</code>,
                                                    pre: ({children}) => <pre className="bg-gray-800 text-green-400 p-3 rounded-lg overflow-x-auto text-sm font-mono mb-3 border">{children}</pre>,
                                                    blockquote: ({children}) => <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg mb-3 italic">{children}</blockquote>,
                                                    hr: () => <hr className="border-gray-300 dark:border-gray-600 my-4" />,
                                                    a: ({href, children}) => <a href={href} className="text-blue-500 hover:text-blue-700 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                                                    table: ({children}) => <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 mb-3">{children}</table>,
                                                    th: ({children}) => <th className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 p-2 text-left font-semibold">{children}</th>,
                                                    td: ({children}) => <td className="border border-gray-300 dark:border-gray-600 p-2">{children}</td>,
                                                }}
                                            >
                                                {message.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                )}
                            </div>
                        </div>
                    ))}

                    {isThinking && (
                        <div className="flex justify-start">
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
                                <div className="flex items-center space-x-2">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        Gemini AI analyzing...
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-end space-x-2">
                        <textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Try: 'I'm a beginner, what indicators should I use?' or 'Set my wallet to $25000' or 'Add AAPL to my symbols'..."
                            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                            rows={2}
                            disabled={isThinking}
                        />

                        {/* Microphone Button */}
                        {speechSupported && (
                            <button
                                onClick={isListening ? stopListening : startListening}
                                disabled={isThinking}
                                className={`p-2 rounded-lg transition-all duration-300 ${
                                    isListening 
                                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                                        : 'bg-gray-500 hover:bg-gray-600 text-white'
                                } disabled:bg-gray-400`}
                                title={isListening ? 'Stop listening' : 'Start voice input'}
                            >
                                {isListening ? (
                                    <img src="https://cdn.hugeicons.com/icons/stop-stroke-rounded.svg" className="w-5 h-5 filter brightness-0 invert" />
                                ) : (
                                    <img src="https://cdn.hugeicons.com/icons/mic-01-stroke-rounded.svg" className="w-5 h-5 filter brightness-0 invert" />
                                )}
                            </button>
                        )}

                        <button
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim() || isThinking}
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg px-4 py-2 transition-colors"
                        >
                            <img src="https://cdn.hugeicons.com/icons/sent-stroke-rounded.svg" className="w-5 h-5 filter brightness-0 invert" />
                        </button>
                    </div>

                    {/* Speech Recognition Status */}
                    {speechSupported && isListening && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span>Listening... Speak now</span>
                            <div className="flex space-x-1">
                                <div className="w-1 h-3 bg-red-500 rounded animate-bounce"></div>
                                <div className="w-1 h-4 bg-red-500 rounded animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-1 h-3 bg-red-500 rounded animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                        </div>
                    )}

                    {!speechSupported && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Voice input not supported in this browser
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};```typescript