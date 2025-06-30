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

## 💬 Try these natural commands:

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

        // Enhanced symbol detection - handle multiple formats
        let symbols: string[] = [];
        
        // Direct symbol matches (XOM, CVX, AAPL, etc.)
        const directSymbolMatches = message.match(/\b([A-Z]{2,5})\b/g);
        if (directSymbolMatches) {
            symbols = directSymbolMatches.filter(s => s.length >= 2 && s.length <= 5);
        }
        
        // Improved Symbol Detection
        if (lowerMessage.includes('add') || lowerMessage.includes('include')) {
            let symbols: string[] = [];
            const directSymbolMatches = message.match(/\b([A-Z]{2,5})\b/g);
            if (directSymbolMatches) {
                symbols = directSymbolMatches;
            }

            if (lowerMessage.includes('energy')) {
                // From constants.ts, we have energy symbols
                const energySymbols = MARKET_OPTIONS.COMMODITIES.find(c => c.value === 'ENERGY')?.symbols?.map(s => s.symbol) || [];
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

        // Market switching with stock additions - Enhanced pattern matching
        if ((lowerMessage.includes('switch to stocks') || lowerMessage.includes('change to stocks')) || 
            (lowerMessage.includes('stocks market') && (lowerMessage.includes('ai stocks') || lowerMessage.includes('add')))) {
            actions.push({
                type: 'switchToStocksAndAddAI',
                value: ['NVDA', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA'],
                description: 'Switch to stocks market and add AI stocks: NVDA, GOOGL, MSFT, AMZN, META, TSLA'
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
                        const symbolsToAdd = action.value.map((symbol: string) => {
                            // Map common symbols to their company names
                            const symbolNames: Record<string, string> = {
                                'NVDA': 'NVIDIA Corporation',
                                'GOOGL': 'Alphabet Inc.',
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
                            
                            return {
                                symbol: symbol,
                                name: symbolNames[symbol] || `${symbol} Corporation`
                            };
                        });
                        
                        onUpdateInputs({ addSymbols: symbolsToAdd });
                        executed = true;
                    }
                    break;
                case 'marketTypeError':
                    // Don't execute - this is an error case that will be handled in the response
                    executed = false;
                    break;
                case 'switchToStocksAndAddAI':
                    if (onUpdateInputs) {
                        // Create symbols first
                        const symbolsToAdd = action.value.map((symbol: string) => {
                            const symbolNames: Record<string, string> = {
                                'NVDA': 'NVIDIA Corporation',
                                'GOOGL': 'Alphabet Inc.',
                                'MSFT': 'Microsoft Corporation',
                                'AMZN': 'Amazon.com Inc.',
                                'META': 'Meta Platforms Inc.',
                                'TSLA': 'Tesla Inc.',
                                'XOM': 'Exxon Mobil Corporation',
                                'CVX': 'Chevron Corporation'
                            };
                            
                            return {
                                symbol: symbol,
                                name: symbolNames[symbol] || `${symbol} Corporation`
                            };
                        });
                        
                        // Switch market and add symbols in a single update
                        onUpdateInputs({ 
                            selectedMarketType: 'STOCKS',
                            selectedMarket: 'US',
                            addSymbols: symbolsToAdd
                        });
                        
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
                conversationHistory: messages.slice(-3)
            };

            const prompt = `🤖 You are the Signatex AI Trading Assistant, powered by Gemini AI. You are integrated into a comprehensive trading analysis platform called Signatex.

📊 CURRENT USER CONTEXT:
- 🎯 Selected Symbols: ${currentInputs?.selectedSymbols?.join(', ') || 'None'}
- 💰 Wallet Amount: $${currentInputs?.walletAmount || '0'}
- 📈 Active Indicators: ${currentInputs?.selectedIndicators?.join(', ') || 'None'}
- ⏰ Timeframe: ${currentInputs?.selectedTimeframe || 'Not set'}
- 🏪 Market Type: ${currentInputs?.selectedMarketType || 'Not set'}
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
            return `## 🎯 Perfect! Welcome to Trading! 

### 🌟 **The Beginner's Golden Trio**

For someone just starting their trading journey, I recommend these **three essential indicators**:

#### 1. 📈 **SMA (Simple Moving Average)**
- 🎯 **Purpose**: Shows trend direction crystal clear
- 💡 **Why it's great**: No confusing signals, just pure trend
- 🔧 **How to use**: Price above SMA = uptrend, below = downtrend

#### 2. 🔄 **RSI (Relative Strength Index)**  
- 🎯 **Purpose**: Spots overbought/oversold conditions
- 💡 **Why it's great**: Simple 0-100 scale (>70 = overbought, <30 = oversold)
- 🔧 **How to use**: Perfect for timing your entries and exits

#### 3. 📊 **Volume**
- 🎯 **Purpose**: Confirms price movements
- 💡 **Why it's great**: High volume = strong moves, low volume = weak moves
- 🔧 **How to use**: Only trust breakouts with high volume

---

### 🤝 **Want me to set these up for you?** 
Just say *"use beginner indicators"* and I'll configure them automatically! 

### 🚀 **Why This Combo Rocks:**
These three work like a **trading dream team** - SMA shows direction, RSI shows timing, and Volume shows strength!

**Ready to start your trading adventure? 🎮💰**`;
        }

        if (lowerMessage.includes('indicator')) {
            return `## 📚 Let's Talk Indicators! 

### 🔧 **Your Current Setup:**
> ${currentInputs?.selectedIndicators?.length ? 
    `📊 **Active:** ${currentInputs.selectedIndicators.join(', ')}` : 
    '❌ **No indicators selected yet**'}

---

### 🎯 **Popular Indicator Combinations:**

| Strategy | Indicators | Best For |
|----------|------------|----------|
| 📈 **Trend Following** | SMA + EMA + MACD | Catching big moves |
| 🔄 **Mean Reversion** | RSI + Bollinger Bands + Stochastic | Buy low, sell high |
| ⚡ **Momentum** | RSI + MACD + Volume | Momentum trades |
| 🚀 **Day Trading** | EMA + RSI + VWAP + Volume | Quick scalps |
| 🎯 **Swing Trading** | SMA + MACD + RSI + Volume | Multi-day holds |

---

### 💭 **Tell me about your trading style:**
- 🏃‍♂️ **Day trader?** (Quick in and out)
- 🏋️‍♂️ **Swing trader?** (Hold for days/weeks)  
- 📚 **Complete beginner?** (Learning the ropes)
- 🚀 **Advanced trader?** (Want complex setups)

**I'll recommend the perfect combination for YOU! 🎯✨**`;
        }

        return `## 💬 I'm Here to Help You Succeed! 

### 🤖 **What I Can Do:**

#### 📊 **Trading Setup:**
- 🎯 Choose optimal indicators for your skill level
- 💰 Set up wallet amounts and position sizing
- ⏰ Configure timeframes for your trading style
- 🔧 Update all your settings through conversation

#### 📈 **Analysis & Insights:**
- 📊 Explain your analysis results in detail
- 🎨 Generate visual market insights  
- 📰 Analyze market news and sentiment
- 🔍 Spot patterns in your data

#### 🚀 **Advanced Features:**
- 🎛️ Guide you through ProfitMax optimization
- ⚡ Walk you through ProFlow automation

---

### 💡 **Try These Commands:**

> 🔰 **"I'm a beginner, what indicators should I use?"**
> 🎛️ **"Set up a day trading configuration"**  
> 📊 **"Explain my analysis results"**
> 💰 **"Set my wallet to $50,000"**
> 📈 **"Add AAPL and TSLA to my watchlist"**

---

### 🎯 **What Would You Like to Explore Today?** 
I'm excited to help you optimize your trading! 🚀📈✨`;
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
        const actionsExecuted = executeActions(actions);

        // Generate response with Gemini AI
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
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg drop-shadow-lg" style={{textShadow: '0 1px 2px rgba(0,0,0,0.5)'}}>S</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="signatex-embossed">Signatex Assistant</span>
                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    Gemini AI
                                </span>
                                {ttsService.isAvailable() && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                        </svg>
                                        TTS Ready
                                    </span>
                                )}
                                {speechSupported && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-full">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
                                            <path d="M19 11a7 7 0 0 1-14 0"/>
                                        </svg>
                                        Voice Input
                                    </span>
                                )}
                                {proFlowStatus?.isRunning && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        ProFlow Active
                                    </span>
                                )}
                                {profitMaxResult && (
                                    <span className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full">
                                        ProfitMax Ready
                                    </span>
                                )}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                AI Trading Expert • Natural Language Commands • Live Integration
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                            className="p-2 hover:bg-accent rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                            title="Clear conversation"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-accent rounded-lg transition-colors">
                            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
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
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M6 6h12v12H6z"/>
                                                        </svg>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => synthesizeAndPlayMessage(message.id, message.content)}
                                                        className="bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded-full shadow-lg transition-colors z-10"
                                                        title="Play audio"
                                                    >
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M8 5v14l11-7z"/>
                                                        </svg>
                                                    </button>
                                                )}
                                                {audioCache.has(message.id) && (
                                                    <div className="bg-green-500 text-white p-1.5 rounded-full shadow-lg" title="Audio cached">
                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                                        </svg>
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
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
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
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M6 6h12v12H6z"/>
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z"/>
                                        <path d="M19 11a7 7 0 0 1-14 0m7 0a4 4 0 0 0 4-4V5a4 4 0 0 0-8 0v2a4 4 0 0 0 4 4Z"/>
                                        <path d="M12 19v3m-4 0h8"/>
                                    </svg>
                                )}
                            </button>
                        )}
                        
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim() || isThinking}
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg px-4 py-2 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
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
};