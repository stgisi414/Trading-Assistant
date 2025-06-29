
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
}

export const SignatexChatbot: React.FC<SignatexChatbotProps> = ({ 
    isOpen, 
    onClose, 
    currentInputs,
    analysisResults,
    profitMaxResult,
    proFlowStatus 
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
                content: `# Hey there, I'm your Signatex AI Assistant! 👋

I'm deeply integrated with all Signatex features and ready for natural conversation about trading, analysis, and optimization.

**🧠 I know everything about:**
- **Signatex Core**: All trading analysis features and technical indicators
- **ProfitMax**: Automated optimization tiers (Light/Pro/Ultra) and profit maximization
- **ProFlow**: Intelligent automation workflows (Auto/Manual modes)
- **Market Analysis**: Real-time data, patterns, and AI-powered insights
- **Risk Management**: Position sizing, wallet optimization, and trading strategies

**💬 Chat naturally with me about:**
- "How's my current portfolio looking?"
- "Should I run ProfitMax optimization?"
- "What's ProFlow doing right now?"
- "Explain this trading signal"
- "Help me understand these chart patterns"

What's on your mind today? I'm here to help you master Signatex! 🚀`,
                timestamp: new Date()
            }
        ];
    });
    const [inputMessage, setInputMessage] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Save conversation history to localStorage
    useEffect(() => {
        localStorage.setItem('signatex_chat_history', JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const generateDynamicResponse = async (userMessage: string): Promise<string> => {
        const lowerMessage = userMessage.toLowerCase();
        
        // Create comprehensive context
        const context = {
            inputs: currentInputs,
            results: analysisResults?.length || 0,
            hasResults: analysisResults && analysisResults.length > 0,
            profitMaxActive: !!profitMaxResult,
            proFlowRunning: proFlowStatus?.isRunning || false,
            proFlowPaused: proFlowStatus?.isPaused || false,
            conversationHistory: messages.slice(-4)
        };

        // Greeting responses
        if (lowerMessage.match(/^(hi|hello|hey|sup|yo|greetings)/)) {
            const greetings = [
                `Hey! 👋 Ready to dive into some trading analysis? I see you have ${context.inputs?.selectedSymbols?.length || 0} symbols selected.`,
                `Hello there! 🤖 I'm here to help you navigate Signatex. What's your trading strategy today?`,
                `Hi! Welcome back to Signatex! I can help with analysis, ProfitMax optimization, or ProFlow automation. What interests you?`,
                `Hey! 🚀 Good to see you. I'm fully synced with your current setup - let's make some profitable moves!`
            ];
            return greetings[Math.floor(Math.random() * greetings.length)];
        }

        // ProFlow status and integration
        if (lowerMessage.includes('proflow') || lowerMessage.includes('automation') || lowerMessage.includes('automate')) {
            if (context.proFlowRunning) {
                if (context.proFlowPaused) {
                    return `🔄 **ProFlow Status: PAUSED**

ProFlow is currently paused at step ${proFlowStatus?.currentStep + 1}/${proFlowStatus?.totalSteps}: "${proFlowStatus?.currentStepName}"

**Current Mode:** ${proFlowStatus?.mode} mode
**Next Action:** Waiting for your confirmation to continue

ProFlow is intelligently setting up your trading environment with optimal parameters. In ${proFlowStatus?.mode} mode, ${proFlowStatus?.mode === 'manual' ? 'you control each step' : 'it runs automatically with smart delays'}.

**What ProFlow is doing:**
- Selecting high-performance market types (STOCKS for maximum liquidity)
- Adding proven profitable symbols (AAPL, TSLA, MSFT)
- Configuring optimal technical indicators
- Setting appropriate wallet amounts for risk management
- Triggering comprehensive AI analysis

Want me to explain what the current step does, or shall we continue?`;
                } else {
                    return `🚀 **ProFlow Status: RUNNING**

ProFlow automation is actively running! Currently on step ${proFlowStatus?.currentStep + 1}/${proFlowStatus?.totalSteps}: "${proFlowStatus?.currentStepName}"

**Mode:** ${proFlowStatus?.mode}
**Progress:** ${Math.round(((proFlowStatus?.currentStep + 1) / proFlowStatus?.totalSteps) * 100)}% complete

ProFlow is your intelligent trading assistant that demonstrates Signatex's full capabilities by:
- **Smart Symbol Selection**: Choosing high-volume, liquid assets
- **Optimal Indicator Configuration**: Selecting complementary technical indicators
- **Risk-Appropriate Wallet Sizing**: Setting amounts based on portfolio theory
- **Comprehensive Analysis Execution**: Running full AI-powered market analysis

The automation will complete soon and you'll have a fully optimized trading setup. Pretty cool, right? 😎`;
                }
            } else {
                return `🤖 **ProFlow: Your Intelligent Trading Automation**

ProFlow isn't running right now, but it's one of Signatex's most powerful features! It's like having a professional trader set up your entire analysis automatically.

**What ProFlow Does:**
✅ **Auto-Configuration**: Selects optimal markets, symbols, and indicators
✅ **Smart Defaults**: Uses proven trading parameters and risk management
✅ **Demo Mode**: Shows you how professional traders approach market analysis
✅ **Learning Tool**: Teaches you optimal configurations through automation

**Two Modes Available:**
- **Auto Mode**: Runs seamlessly with intelligent timing
- **Manual Mode**: Step-by-step learning with your control

**Perfect for:**
- Beginners learning optimal setups
- Experienced traders wanting quick configuration
- Demonstrating Signatex capabilities
- Testing different parameter combinations

Want to start ProFlow? It'll show you how to set up a winning trading configuration! 🎯`;
            }
        }

        // ProfitMax integration and knowledge
        if (lowerMessage.includes('profitmax') || lowerMessage.includes('optimization') || lowerMessage.includes('optimize')) {
            if (context.profitMaxActive) {
                const result = profitMaxResult;
                return `💰 **ProfitMax Optimization Results**

Great news! Your ProfitMax optimization is complete and looking promising:

**🎯 Optimized Configuration:**
- **Best Symbols**: ${result?.bestSymbols?.map(s => s.symbol).join(', ') || 'Multiple assets'}
- **Optimal Wallet**: $${result?.bestWalletAmount?.toLocaleString() || 'Optimized'}
- **Best Indicators**: ${result?.bestIndicators?.join(', ') || 'Technical indicators'}
- **Timeframe**: ${result?.bestTimeframe || 'Optimized period'}

**📊 Performance Metrics:**
- **Expected Profit**: ${result?.expectedProfitPercentage?.toFixed(2) || 'N/A'}%
- **Confidence Level**: ${result?.confidence?.toFixed(1) || 'N/A'}%

**🔍 Analysis Depth:**
- Analyzed ${result?.optimizationDetails?.totalAnalyses || 'multiple'} different combinations
- Tested ${result?.optimizationDetails?.symbolsAnalyzed || 'various'} symbols
- Evaluated ${result?.optimizationDetails?.indicatorCombinationsAnalyzed || 'different'} indicator sets

ProfitMax used advanced algorithms to find the sweet spot between profit potential and risk management. These results are based on historical patterns, technical analysis, and market dynamics.

Ready to apply these optimized settings to your trading setup? 🚀`;
            } else {
                return `🎯 **ProfitMax: AI-Powered Trading Optimization**

ProfitMax is Signatex's crown jewel - an intelligent optimization engine that finds the perfect trading configuration for maximum profitability!

**🧠 How ProfitMax Works:**
1. **Multi-Dimensional Analysis**: Tests thousands of combinations (symbols, indicators, wallet amounts, timeframes)
2. **AI-Driven Selection**: Uses machine learning to predict profitable configurations
3. **Risk-Reward Optimization**: Balances profit potential with risk management
4. **Backtesting Integration**: Validates strategies against historical data

**💪 Three Power Tiers:**
- **Light** (~2-5 min): Quick optimization for fast decisions
- **Pro** (~5-10 min): Comprehensive analysis for serious traders  
- **Ultra** (~10-15 min): Maximum optimization for professional results

**🎯 What Gets Optimized:**
- **Symbol Selection**: Finds assets with best profit potential
- **Technical Indicators**: Chooses combinations that work together
- **Wallet Allocation**: Optimizes position sizing and risk management
- **Timeframe Selection**: Picks optimal analysis periods

**💡 Perfect For:**
- Maximizing portfolio performance
- Finding hidden profitable opportunities
- Learning optimal trading configurations
- Reducing guesswork in trading decisions

Your current setup: ${context.inputs?.selectedSymbols?.length || 0} symbols, $${context.inputs?.walletAmount || 0} wallet. Want to see what ProfitMax can do with this? 🚀`;
            }
        }

        // Technical analysis and results interpretation
        if (context.hasResults && (lowerMessage.includes('result') || lowerMessage.includes('analysis') || lowerMessage.includes('position') || lowerMessage.includes('recommendation'))) {
            const symbols = context.inputs?.selectedSymbols || [];
            const totalResults = context.results;
            
            const analysisOverview = analysisResults?.map(result => ({
                symbol: result.symbol,
                position: result.analysisResult?.position || 'HOLD',
                confidence: result.analysisResult?.confidence || '50%',
                hasNews: result.analysisResult?.news?.length > 0,
                hasPatterns: result.patternDetails?.length > 0
            })) || [];

            const buySignals = analysisOverview.filter(r => r.position === 'BUY').length;
            const sellSignals = analysisOverview.filter(r => r.position === 'SELL').length;
            const holdSignals = analysisOverview.filter(r => r.position === 'HOLD').length;

            return `📊 **Your Current Analysis Breakdown**

Looking at your portfolio analysis - here's what Signatex AI discovered:

**🎯 Signal Distribution:**
- 🟢 **BUY Signals**: ${buySignals} positions
- 🔴 **SELL Signals**: ${sellSignals} positions  
- 🟡 **HOLD Signals**: ${holdSignals} positions

**🔍 Detailed Insights:**
${analysisOverview.map(result => `
**${result.symbol}**: ${result.position} (${result.confidence} confidence)
- ${result.hasNews ? '📰 News sentiment analyzed' : '📰 No recent news impact'}
- ${result.hasPatterns ? '📈 Chart patterns detected' : '📈 No significant patterns'}
`).join('')}

**💰 Risk Assessment:**
- Your wallet: $${context.inputs?.walletAmount?.toLocaleString() || '0'}
- Recommended per trade: $${Math.round(parseFloat(context.inputs?.walletAmount || '0') * 0.02).toLocaleString()} (2% rule)
- Total recommended exposure: $${Math.round(parseFloat(context.inputs?.walletAmount || '0') * 0.06 * buySignals).toLocaleString()}

**🎓 What This Means:**
${buySignals > sellSignals ? 
    `The market looks bullish for your selected assets! ${buySignals} BUY signals suggest good upward momentum. Consider scaling into positions gradually.` :
sellSignals > buySignals ?
    `Caution advised - ${sellSignals} SELL signals indicate potential downward pressure. Consider defensive strategies or wait for better entry points.` :
    `Mixed signals suggest a consolidating market. Good time for patient position building or profit-taking on existing positions.`}

Want me to dive deeper into any specific symbol or explain the technical reasoning? 🤔`;
        }

        // Market and trading education
        if (lowerMessage.includes('indicator') || lowerMessage.includes('technical') || lowerMessage.includes('sma') || lowerMessage.includes('rsi') || lowerMessage.includes('macd')) {
            const selectedIndicators = context.inputs?.selectedIndicators || [];
            
            return `📚 **Technical Indicators Deep Dive**

You're using ${selectedIndicators.length} indicators: ${selectedIndicators.join(', ')}. Let me break down what makes them powerful:

**🔥 Your Current Indicator Stack:**

${selectedIndicators.includes('SMA') || selectedIndicators.includes('EMA') ? `
**Moving Averages (SMA/EMA)**: Your trend compass 🧭
- **What it does**: Smooths price action to show trend direction
- **SMA vs EMA**: SMA = simple average, EMA = weighted toward recent prices
- **Pro tip**: Use multiple periods (20, 50, 200) for confluence
- **Best for**: Trend following, support/resistance levels
` : ''}

${selectedIndicators.includes('RSI') ? `
**RSI (Relative Strength Index)**: Your momentum detector 🚀
- **What it does**: Measures if an asset is overbought (>70) or oversold (<30)
- **Sweet spots**: Buy near 30, sell near 70, but respect the trend!
- **Pro tip**: Works best in ranging markets, less reliable in strong trends
- **Best for**: Entry/exit timing, divergence spotting
` : ''}

${selectedIndicators.includes('MACD') ? `
**MACD**: Your momentum and trend analyzer 📈
- **What it does**: Shows relationship between two moving averages
- **Key signals**: Line crossovers, histogram changes, divergences
- **Pro tip**: Wait for histogram to change direction for stronger signals
- **Best for**: Trend changes, momentum confirmation
` : ''}

${selectedIndicators.includes('BollingerBands') ? `
**Bollinger Bands**: Your volatility gauge 🎯
- **What it does**: Shows price volatility and potential reversal zones
- **Key insight**: 95% of price action stays within the bands
- **Pro tip**: Band squeezes often precede big moves
- **Best for**: Volatility breakouts, mean reversion trades
` : ''}

**🎯 How They Work Together:**
${selectedIndicators.length > 1 ? 
    `Your multi-indicator approach is smart! When RSI confirms MACD signals, or when price respects SMA levels while RSI shows divergence, you get high-probability setups.` :
    `Consider adding complementary indicators for better confirmation!`}

**Current Market Context:**
Your ${context.inputs?.selectedTimeframe || 'selected'} timeframe is ${
    context.inputs?.selectedTimeframe === '15m' || context.inputs?.selectedTimeframe === '1h' ? 'perfect for day trading with these indicators' :
    context.inputs?.selectedTimeframe === '1d' || context.inputs?.selectedTimeframe === '1M' ? 'ideal for swing trading and position building' :
    'great for your chosen trading style'
}.

Want me to explain how to combine these indicators for your specific symbols? 🤓`;
        }

        // Wallet and risk management
        if (lowerMessage.includes('wallet') || lowerMessage.includes('money') || lowerMessage.includes('risk') || lowerMessage.includes('position size')) {
            const wallet = parseFloat(context.inputs?.walletAmount || '0');
            const symbols = context.inputs?.selectedSymbols?.length || 0;
            
            return `💰 **Your Wallet & Risk Management Strategy**

**Current Setup Analysis:**
- **Wallet Size**: $${wallet.toLocaleString()}
- **Selected Assets**: ${symbols} symbols
- **Diversification Level**: ${symbols <= 2 ? 'Concentrated' : symbols <= 5 ? 'Balanced' : 'Highly Diversified'}

**🎯 Professional Risk Management Rules:**

**Position Sizing (2% Rule):**
- **Per Trade Risk**: $${Math.round(wallet * 0.02).toLocaleString()} maximum
- **Position Size Range**: $${Math.round(wallet * 0.05).toLocaleString()} - $${Math.round(wallet * 0.15).toLocaleString()} per position
- **Max Portfolio Exposure**: ${Math.min(symbols * 15, 60)}% (${symbols} positions × 15%)

**📊 Wallet Size Strategy:**
${wallet < 5000 ? `
**Small Account Strategy** ($${wallet.toLocaleString()}):
- Focus on 1-3 high-conviction trades
- Use tight stop-losses (1-2%)
- Avoid options until account grows
- Paper trade complex strategies first
- Target: 15-25% annual returns
` : wallet < 25000 ? `
**Medium Account Strategy** ($${wallet.toLocaleString()}):
- Hold 3-7 diversified positions
- Options trading acceptable with small positions
- Mix swing and position trades
- Risk 1.5-2.5% per trade
- Target: 20-35% annual returns
` : `
**Large Account Strategy** ($${wallet.toLocaleString()}):
- Full diversification across sectors
- Professional options strategies
- Consider ETFs for stability
- Risk 1-2% per trade maximum
- Target: 15-30% annual returns with lower volatility
`}

**🧠 Signatex Integration:**
- Our AI considers your wallet size in every recommendation
- Position sizes automatically calculated for optimal risk/reward
- ProfitMax optimizes wallet allocation across assets
- ProFlow sets conservative defaults for learning

**🎯 Action Items:**
1. **Emergency Fund**: Keep 10-15% in cash for opportunities
2. **Diversification**: Don't put all eggs in one sector
3. **Stop Losses**: Always define your exit before entry
4. **Review Frequency**: Weekly portfolio health checks

Your current setup looks ${symbols > 0 && wallet > 1000 ? 'solid' : 'ready for optimization'}! Want specific position sizing for your selected symbols? 💪`;
        }

        // Chart patterns and technical analysis
        if (lowerMessage.includes('pattern') || lowerMessage.includes('chart') || lowerMessage.includes('support') || lowerMessage.includes('resistance')) {
            return `📈 **Chart Pattern Recognition & Analysis**

Signatex automatically detects chart patterns to give you an edge in the markets! Here's what you need to know:

**🔍 Patterns We Detect:**

**Bullish Reversal Patterns:**
- **Double Bottom**: Strong support found twice - bullish reversal likely
- **Head & Shoulders Bottom**: Major reversal pattern after downtrend
- **Ascending Triangle**: Higher lows, same resistance - breakout expected
- **Cup & Handle**: Long-term accumulation pattern - very bullish

**Bearish Reversal Patterns:**
- **Double Top**: Resistance tested twice and holding - bearish reversal
- **Head & Shoulders Top**: Distribution pattern - trend change coming
- **Descending Triangle**: Lower highs, same support - breakdown likely
- **Rising Wedge**: Bearish divergence in uptrend - reversal signal

**🎯 How Signatex Uses Patterns:**

**Pattern Confidence Scoring:**
- **High (90%+)**: Clear formation, volume confirmation, multiple touches
- **Medium (70-89%)**: Good formation, some uncertainty in key levels
- **Low (50-69%)**: Emerging pattern, needs more confirmation

**Integration with Analysis:**
- Patterns combined with technical indicators for stronger signals
- Volume analysis confirms pattern validity
- News sentiment provides fundamental backing
- Multiple timeframe confirmation increases reliability

**📊 Current Portfolio Context:**
${context.hasResults ? 
    `Your recent analysis found patterns in ${analysisResults?.filter(r => r.patternDetails && r.patternDetails.length > 0).length || 0} of your symbols. These patterns are factored into position recommendations.` :
    `Run an analysis to see what patterns Signatex detects in your selected symbols!`
}

**🎓 Pro Pattern Trading Tips:**
1. **Wait for Breakouts**: Don't trade the pattern, trade the breakout
2. **Volume Confirmation**: Breakouts need volume to sustain
3. **Target Calculation**: Pattern height = profit target distance
4. **Stop Loss Placement**: Just below pattern support/above resistance
5. **False Breakout Protection**: Wait for follow-through confirmation

**Current Timeframe Impact:**
Your ${context.inputs?.selectedTimeframe || 'selected'} timeframe means ${
    context.inputs?.selectedTimeframe === '15m' || context.inputs?.selectedTimeframe === '1h' ? 'you\'ll see intraday patterns - great for scalping and day trading' :
    context.inputs?.selectedTimeframe === '1d' || context.inputs?.selectedTimeframe === '1M' ? 'you\'re looking at swing trading patterns - perfect for position trades' :
    'you\'re analyzing patterns at the right scale for your trading style'
}.

Want me to explain how to trade specific patterns or analyze your current symbols for pattern opportunities? 🎯`;
        }

        // News and sentiment analysis
        if (lowerMessage.includes('news') || lowerMessage.includes('sentiment') || lowerMessage.includes('fundamental')) {
            return `📰 **News & Sentiment Analysis Integration**

Signatex combines technical analysis with real-time news sentiment for a complete market picture!

**🧠 How Our News Analysis Works:**

**Smart News Aggregation:**
- Pulls from major financial sources (Bloomberg, Reuters, MarketWatch, etc.)
- Filters for relevance to your specific symbols
- Analyzes recency and market impact potential
- Removes noise and focuses on market-moving news

**AI Sentiment Scoring:**
- **Bullish News**: Earnings beats, partnerships, positive guidance
- **Bearish News**: Downgrades, regulatory issues, poor earnings
- **Neutral**: General market news without direct impact

**📊 Integration with Technical Analysis:**
- News sentiment confirms or contradicts technical signals
- Breaking news can invalidate technical patterns
- Earnings dates and events factored into position timing
- Sector-wide news affects correlated positions

**🎯 Your Current Setup:**
${context.hasResults ? 
    `Your recent analysis incorporated news for ${analysisResults?.filter(r => r.analysisResult?.news && r.analysisResult.news.length > 0).length || 0} symbols. News sentiment ${
        analysisResults?.some(r => r.analysisResult?.news && r.analysisResult.news.length > 0) ? 
        'is actively influencing your position recommendations' : 
        'shows neutral impact on your positions'
    }.` :
    `Signatex will automatically pull and analyze relevant news when you run your analysis!`
}

**💡 News-Driven Trading Strategies:**

**Earnings Season:**
- Avoid positions 2-3 days before earnings unless high conviction
- Focus on technical setups 1-2 weeks post-earnings
- Use options for earnings plays (higher risk/reward)

**Fed Announcements:**
- Market-wide impact on all positions
- Rate decisions affect different sectors differently
- Tech stocks sensitive to rate changes

**Company-Specific News:**
- Partnership announcements often drive sustained moves
- Regulatory news can create multi-day trends
- Analyst upgrades/downgrades create short-term volatility

**🔍 News Quality Indicators:**
- **Source Credibility**: Reuters, Bloomberg > Social media
- **Market Hours**: News during market hours has immediate impact
- **Volume Confirmation**: High volume confirms news significance

**Current Market Environment:**
Your ${context.inputs?.selectedSymbols?.join(', ') || 'selected symbols'} are being monitored for breaking news and sentiment changes that could affect your positions.

Want me to explain how specific news events might impact your current positions? 📈`;
        }

        // Options analysis
        if (lowerMessage.includes('option') || lowerMessage.includes('call') || lowerMessage.includes('put') || lowerMessage.includes('premium')) {
            return `📊 **Options Analysis & Strategy**

Signatex provides sophisticated options analysis to enhance your trading strategies!

**🎯 How Our Options Analysis Works:**

**Options Data Integration:**
- Real-time bid/ask spreads for liquidity assessment
- Open interest analysis for market sentiment
- Implied volatility for option pricing
- Greeks calculation for risk management

**Strategic Recommendations:**
- **Call Options**: For bullish positions and leverage
- **Put Options**: For bearish bets and portfolio protection
- **Spreads**: For defined risk/reward scenarios
- **Covered Strategies**: For income generation

**📈 Options Strategies by Market Outlook:**

**Bullish Strategies:**
- **Buy Calls**: Maximum upside leverage
- **Sell Cash-Secured Puts**: Generate income while waiting for entry
- **Bull Call Spreads**: Defined risk/reward

**Bearish Strategies:**
- **Buy Puts**: Profit from downside moves
- **Covered Calls**: Generate income on existing positions
- **Bear Put Spreads**: Limited risk bearish bet

**Neutral Strategies:**
- **Iron Condors**: Profit from sideways movement
- **Straddles**: Profit from volatility expansion
- **Covered Calls**: Income generation

**🔍 Key Options Metrics Signatex Analyzes:**

**Bid/Ask Spreads:**
- Tight spreads (< 5% of premium) = Good liquidity
- Wide spreads (> 10% of premium) = Poor liquidity, avoid

**Open Interest:**
- High OI = Liquid market, institutional interest
- Low OI = Retail dominated, harder to exit

**Implied Volatility:**
- High IV = Expensive options, consider selling
- Low IV = Cheap options, consider buying

**🎯 Your Portfolio Context:**
${context.inputs?.includeOptionsAnalysis ? 
    `Options analysis is enabled in your current setup! Signatex will provide specific call/put recommendations based on your position signals.` :
    `Enable options analysis in your settings to get call/put recommendations with your regular analysis!`
}

**💰 Risk Management for Options:**
- Never risk more than 2-5% of portfolio on single option trade
- Always have exit strategy defined
- Consider time decay (theta) in holding period
- Use stop losses even on options

**📚 Education Integration:**
- Signatex explains the 'why' behind each options recommendation
- Greeks education to understand risk exposures
- Strategy selection based on market conditions
- Real-time pricing and profit/loss calculations

Want to learn about specific options strategies or how to interpret options analysis in your results? 📊`;
        }

        // General trading advice and philosophy
        if (lowerMessage.includes('strategy') || lowerMessage.includes('trading') || lowerMessage.includes('advice') || lowerMessage.includes('tips')) {
            return `🎯 **Trading Strategy & Philosophy**

Let me share some battle-tested trading wisdom integrated into Signatex's AI recommendations:

**📊 The Signatex Trading Philosophy:**

**1. Process Over Profits**
- Consistent methodology beats lucky wins
- Document every trade decision and outcome
- Learn from both wins and losses
- Signatex tracks your decision patterns over time

**2. Risk Management is King**
- Protect capital first, grow it second
- Never risk more than you can afford to lose completely
- Position sizing matters more than entry price
- Signatex automatically calculates optimal position sizes

**3. Confluence Trading**
- Multiple indicators agreeing = higher probability
- Technical + fundamental + sentiment alignment
- Wait for setups that check multiple boxes
- Signatex scores every recommendation based on confluence

**🎯 Strategy by Trading Style:**

**Day Trading (< 1 day):**
- Timeframes: 5m, 15m, 1h
- Focus: Momentum, volume, intraday patterns
- Risk: 0.5-1% per trade
- Tools: Scalping indicators, level 2 data

**Swing Trading (2-10 days):**
- Timeframes: 1h, 4h, 1d
- Focus: Technical patterns, earnings cycles
- Risk: 1-2% per trade
- Tools: Pattern recognition, news sentiment

**Position Trading (weeks to months):**
- Timeframes: 1d, 1w, 1M
- Focus: Fundamental trends, macro cycles
- Risk: 2-3% per trade
- Tools: Long-term indicators, sector analysis

**📈 Your Current Strategy Assessment:**
- **Wallet**: $${context.inputs?.walletAmount?.toLocaleString() || '0'} (${parseFloat(context.inputs?.walletAmount || '0') < 10000 ? 'Conservative approach recommended' : 'Multiple strategies viable'})
- **Timeframe**: ${context.inputs?.selectedTimeframe || 'Not selected'} (${context.inputs?.selectedTimeframe === '15m' ? 'Day trading setup' : context.inputs?.selectedTimeframe === '1d' ? 'Swing trading setup' : 'Strategy-dependent'})
- **Symbols**: ${context.inputs?.selectedSymbols?.length || 0} (${(context.inputs?.selectedSymbols?.length || 0) < 3 ? 'Focused approach' : 'Diversified approach'})

**🧠 Psychological Trading Rules:**
1. **Plan Your Trade, Trade Your Plan**: Never deviate from predetermined strategy
2. **Cut Losses Quick, Let Winners Run**: Opposite of human nature, but essential
3. **Don't Revenge Trade**: Bad trades lead to worse trades
4. **Size Down When Uncertain**: Confidence should determine position size
5. **Take Breaks**: Mental fatigue kills good decision making

**🎯 How Signatex Helps:**
- **Removes Emotion**: AI doesn't get scared or greedy
- **Consistent Analysis**: Same rigorous process every time
- **Risk Integration**: Automatically factors in your risk tolerance
- **Learning Tool**: Explanations help you understand the 'why'
- **Backtesting**: See how strategies performed historically

Want me to help you refine your specific trading approach or discuss advanced strategy concepts? 💪`;
        }

        // Current status and general help
        if (lowerMessage.includes('status') || lowerMessage.includes('what') || lowerMessage.includes('how') || lowerMessage.includes('help')) {
            const symbols = context.inputs?.selectedSymbols || [];
            const hasAnalysis = context.hasResults;
            
            return `🎯 **Your Current Signatex Status**

**📊 Portfolio Overview:**
- **Selected Assets**: ${symbols.length > 0 ? symbols.join(', ') : 'None selected yet'}
- **Wallet Amount**: $${context.inputs?.walletAmount?.toLocaleString() || '0'}
- **Market Focus**: ${context.inputs?.selectedMarketType || 'Not selected'} (${context.inputs?.selectedMarket || 'No region'})
- **Analysis Timeframe**: ${context.inputs?.selectedTimeframe || 'Not set'}
- **Active Indicators**: ${context.inputs?.selectedIndicators?.length || 0} selected

**🤖 AI Features Status:**
- **Analysis Results**: ${hasAnalysis ? `✅ ${context.results} positions analyzed` : '❌ No analysis run yet'}
- **ProfitMax**: ${context.profitMaxActive ? '✅ Optimization complete' : '❌ Not run yet'}
- **ProFlow**: ${context.proFlowRunning ? '🔄 Currently running' : '❌ Not active'}
- **Options Analysis**: ${context.inputs?.includeOptionsAnalysis ? '✅ Enabled' : '❌ Disabled'}

**🎯 Quick Actions You Can Take:**

${symbols.length === 0 ? '1. **Add Symbols**: Search and select assets to analyze' : ''}
${!hasAnalysis ? `${symbols.length > 0 ? '1' : '2'}. **Run Analysis**: Get AI-powered trading recommendations` : ''}
${!context.profitMaxActive ? `${hasAnalysis ? '1' : symbols.length > 0 ? '2' : '3'}. **Try ProfitMax**: Optimize your entire setup for maximum profits` : ''}
${!context.proFlowRunning ? `${context.profitMaxActive ? '1' : hasAnalysis ? '2' : symbols.length > 0 ? '3' : '4'}. **Start ProFlow**: Watch intelligent automation in action` : ''}

**💬 Natural Conversation Examples:**
- "Explain my AAPL analysis results"
- "Should I increase my wallet amount?"
- "What's the best timeframe for day trading?"
- "How do I read these chart patterns?"
- "Is this a good time to use ProfitMax?"
- "What indicators work well together?"

**🧠 I Know Everything About:**
- Technical indicator combinations and optimization
- Risk management and position sizing strategies
- Chart pattern recognition and trading signals
- News sentiment impact on price movements
- Options strategies and Greeks analysis
- Market psychology and trading discipline
- Backtesting and strategy development

I'm here for natural conversation about trading, market analysis, and helping you master Signatex! What's on your mind? 🚀`;
        }

        // Conversation starters and random topics
        const conversationStarters = [
            `🤔 **Interesting question!** Let me think about this from a trading perspective...

Based on your current setup with ${context.inputs?.selectedSymbols?.length || 0} symbols and $${context.inputs?.walletAmount || '0'} wallet, here's what I'm thinking:

${context.hasResults ? 
    `Your recent analysis shows some interesting patterns. The market seems to be ${analysisResults?.filter(r => r.analysisResult?.position === 'BUY').length > analysisResults?.filter(r => r.analysisResult?.position === 'SELL').length ? 'favoring bullish positions' : 'showing mixed signals'} right now.` :
    `Without recent analysis, I'd recommend starting with a comprehensive scan of your selected assets to see what opportunities exist.`}

What specific aspect interests you most? I can dive deeper into technical analysis, risk management, or any trading topic you're curious about! 💭`,

            `💡 **Great point to discuss!** 

Trading is as much about psychology as it is about technical analysis. Your question makes me think about how ${context.inputs?.selectedTimeframe === '15m' ? 'day traders need to manage fast-paced decisions' : context.inputs?.selectedTimeframe === '1d' ? 'swing traders balance patience with action' : 'different timeframes require different mindsets'}.

With your current ${context.inputs?.selectedSymbols?.length || 0} symbol portfolio, the key is maintaining consistency in your approach. Whether you're using ${context.inputs?.selectedIndicators?.join(' and ') || 'technical indicators'} or relying on fundamental analysis, having a systematic process is crucial.

${context.proFlowRunning ? 'I notice ProFlow is running - that\'s perfect timing to see how systematic approaches work!' : 'Have you considered using ProFlow to see how systematic trading setups work?'}

What's your experience been with systematic vs. discretionary trading? 🎯`,

            `📈 **That's a fascinating trading topic!**

Your setup reminds me of a professional trader's approach - ${context.inputs?.selectedSymbols?.length > 3 ? 'diversified symbol selection' : 'focused portfolio'} with ${parseFloat(context.inputs?.walletAmount || '0') > 10000 ? 'substantial capital' : 'conservative capital management'}.

The beauty of modern trading is how we can combine traditional technical analysis with AI-powered insights. Your ${context.inputs?.selectedIndicators?.length || 0} selected indicators work together to create a comprehensive view of market conditions.

${context.profitMaxActive ? 'Your ProfitMax results show the power of optimization - finding the sweet spot between risk and reward.' : 'ProfitMax could show you some interesting optimization opportunities with your current setup.'}

I find that the best traders are always learning and adapting. What's been your biggest trading lesson recently? 🤓`,

            `🚀 **Let's explore this together!**

Trading success comes from understanding both the technical and fundamental aspects of markets. With Signatex, you're getting the best of both worlds - sophisticated AI analysis combined with educational insights.

Your current configuration suggests you're serious about trading: ${context.inputs?.selectedTimeframe || 'flexible timeframe'}, ${context.inputs?.selectedMarketType || 'multi-market'} focus, and ${context.inputs?.walletAmount ? `$${parseFloat(context.inputs.walletAmount).toLocaleString()} in capital` : 'capital ready for deployment'}.

${context.hasResults ? 
    `The analysis results you have show the power of combining multiple data sources - technical indicators, news sentiment, and pattern recognition all working together.` :
    `Once you run an analysis, you'll see how powerful it is when technical indicators, news sentiment, and pattern recognition all align.`}

What aspect of trading excites you most? The analytical challenge, the profit potential, or the continuous learning? 💭`
        ];

        // Return a dynamic conversation starter for unrecognized inputs
        return conversationStarters[Math.floor(Math.random() * conversationStarters.length)];
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

        // Simulate thinking time with realistic variation
        setTimeout(async () => {
            const response = await generateDynamicResponse(inputMessage);
            const botMessage: ChatMessage = {
                id: Date.now().toString() + '-bot',
                type: 'bot',
                content: response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
            setIsThinking(false);
        }, 800 + Math.random() * 1500);
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
                                <span className="signatex-embossed">S</span>ignatex Assistant
                                {proFlowStatus?.isRunning && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
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
                                AI Trading Expert • Fully Integrated • Ready to Chat
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                setMessages([{
                                    id: '1',
                                    type: 'bot',
                                    content: `# Hey again! 👋

Conversation cleared and ready for fresh insights! I'm still fully synced with your Signatex setup and ready to chat about anything trading-related.

What's on your mind? 🚀`,
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
                            <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                    message.type === 'user'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                }`}
                            >
                                {message.type === 'bot' ? (
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                h1: ({children}) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                                                h2: ({children}) => <h2 className="text-md font-semibold mb-2">{children}</h2>,
                                                h3: ({children}) => <h3 className="text-sm font-medium mb-1">{children}</h3>,
                                                p: ({children}) => <p className="mb-2">{children}</p>,
                                                ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                                ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                                li: ({children}) => <li className="text-sm">{children}</li>,
                                                strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                                                code: ({children}) => <code className="bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                                            }}
                                        >
                                            {message.content}
                                        </ReactMarkdown>
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
                                        <span className="signatex-embossed text-sm">S</span>ignatex is analyzing...
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
                            placeholder="Chat naturally about trading, ask about your results, discuss strategies, or get help with Signatex features..."
                            className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                            rows={2}
                            disabled={isThinking}
                        />
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
                </div>
            </div>
        </div>
    );
};
