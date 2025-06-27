
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
    };
    analysisResults?: any[];
}

export const SignatexChatbot: React.FC<SignatexChatbotProps> = ({ 
    isOpen, 
    onClose, 
    currentInputs,
    analysisResults 
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            type: 'bot',
            content: `# Welcome to Signatex Assistant! 🤖

I'm here to help you understand and optimize your trading analysis settings. I can:

**📊 Input Guidance:**
- Explain technical indicators and their best use cases
- Suggest optimal timeframes for different trading strategies
- Help you choose appropriate wallet amounts for risk management
- Recommend market types and asset combinations

**📈 Output Analysis:**
- Break down your trading recommendations
- Explain confidence levels and reasoning
- Interpret chart patterns and open interest data
- Clarify options analysis results

**💡 Ask me anything like:**
- "What indicators work best for day trading?"
- "How should I interpret a 75% confidence BUY signal?"
- "What does high open interest mean for my position?"
- "Should I increase my wallet amount?"

How can I assist you today?`,
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const generateResponse = async (userMessage: string): Promise<string> => {
        // Create context about current state
        const context = {
            inputs: currentInputs,
            results: analysisResults?.length || 0,
            hasResults: analysisResults && analysisResults.length > 0
        };

        // Simple pattern matching for common queries
        const lowerMessage = userMessage.toLowerCase();

        if (lowerMessage.includes('indicator') || lowerMessage.includes('technical')) {
            return `## Technical Indicators Guide 📊

**Popular Indicators & Their Uses:**

**Trend Indicators:**
- **SMA/EMA**: Best for identifying trend direction and support/resistance
- **MACD**: Excellent for momentum changes and entry/exit signals
- **Bollinger Bands**: Great for volatility and overbought/oversold conditions

**Momentum Indicators:**
- **RSI**: Perfect for identifying overbought (>70) and oversold (<30) conditions
- **Stochastic**: Similar to RSI but more sensitive to price changes
- **Williams %R**: Good for short-term reversal signals

**Volume Indicators:**
- **Volume**: Essential for confirming price movements
- **OBV**: Shows if volume is flowing into or out of an asset

**Current Setup:** ${currentInputs?.selectedIndicators.join(', ') || 'None selected'}

**Recommendation:** For balanced analysis, try combining:
- 1 Trend indicator (SMA or EMA)
- 1 Momentum indicator (RSI)
- Volume confirmation

What specific indicator would you like to know more about?`;
        }

        if (lowerMessage.includes('timeframe') || lowerMessage.includes('time')) {
            return `## Timeframe Selection Guide ⏰

**Current Timeframe:** ${currentInputs?.selectedTimeframe || 'Not selected'}

**Timeframe Strategies:**

**5-15 Minutes**: Scalping
- ✅ Quick profits, many opportunities
- ❌ High stress, requires constant monitoring
- 💰 Smaller wallet amounts ($1,000-$5,000)

**1-4 Hours**: Day Trading
- ✅ Good balance of opportunities and analysis time
- ✅ Clear trend identification
- 💰 Medium wallet amounts ($5,000-$25,000)

**Daily**: Swing Trading
- ✅ Less stress, better for beginners
- ✅ Fundamental analysis matters more
- 💰 Larger wallet amounts ($10,000+)

**Weekly/Monthly**: Position Trading
- ✅ Long-term wealth building
- ✅ Less frequent monitoring needed
- 💰 Substantial wallet amounts ($25,000+)

**Your Current Wallet:** $${currentInputs?.walletAmount || '0'}

Would you like specific recommendations for your wallet size?`;
        }

        if (lowerMessage.includes('confidence') || lowerMessage.includes('buy') || lowerMessage.includes('sell')) {
            if (!context.hasResults) {
                return `## Understanding Trading Signals 🎯

I notice you haven't run an analysis yet. Once you do, I can help explain:

**Confidence Levels:**
- **90-100%**: Very high confidence - strong signals align
- **70-89%**: High confidence - most indicators agree
- **50-69%**: Moderate confidence - mixed signals
- **30-49%**: Low confidence - uncertain conditions
- **Below 30%**: Very low confidence - avoid trading

**Position Types:**
- **BUY**: Bullish signals suggest price increase
- **SELL**: Bearish signals suggest price decrease  
- **HOLD**: Mixed or unclear signals suggest waiting

Run an analysis first, then ask me to explain your specific results!`;
            }

            return `## Interpreting Your Trading Signals 📈

**Understanding Confidence Levels:**

**High Confidence (70%+):**
- Multiple indicators align
- Strong trend confirmation
- News sentiment supports technical analysis
- Consider taking the position

**Medium Confidence (50-70%):**
- Some conflicting signals
- Market uncertainty present
- Consider smaller position sizes
- Wait for additional confirmation

**Low Confidence (<50%):**
- Indicators disagree
- High market uncertainty
- Avoid taking positions
- Wait for clearer signals

**Risk Management Tips:**
- Never risk more than 2-3% of your wallet on a single trade
- Use stop-losses to limit downside
- Consider position sizing based on confidence level

Would you like me to analyze your specific results?`;
        }

        if (lowerMessage.includes('open interest') || lowerMessage.includes('options')) {
            return `## Open Interest & Options Analysis 📊

**Open Interest Explained:**
- **Definition**: Total number of outstanding option contracts
- **High OI**: More liquid, tighter spreads, institutional interest
- **Low OI**: Less liquid, wider spreads, retail focused

**Trend Analysis:**
- **Increasing OI + Rising Price**: Strong bullish momentum
- **Increasing OI + Falling Price**: Strong bearish momentum
- **Decreasing OI**: Position unwinding, trend weakening

**Speculative Ratio:**
- **Low (0-1.5)**: Conservative, institutional activity
- **Medium (1.5-3)**: Balanced retail/institutional mix
- **High (3+)**: Highly speculative, retail driven

**Market Sentiment:**
- **Bullish**: More calls than puts being bought
- **Bearish**: More puts than calls being bought
- **Neutral**: Balanced call/put activity

This data helps confirm or contradict your technical analysis signals.`;
        }

        if (lowerMessage.includes('wallet') || lowerMessage.includes('amount') || lowerMessage.includes('money')) {
            const currentWallet = parseFloat(currentInputs?.walletAmount || '0');
            
            return `## Wallet Amount & Risk Management 💰

**Your Current Wallet:** $${currentWallet.toLocaleString()}

**Recommended Allocation:**

${currentWallet < 1000 ? `
**Micro Trading ($${currentWallet}):**
- Focus on learning, not profits
- Use paper trading first
- Risk only $10-20 per trade
- Stick to major stocks/ETFs
` : currentWallet < 5000 ? `
**Small Account ($${currentWallet}):**
- Risk 1-2% per trade ($${(currentWallet * 0.02).toFixed(0)})
- Focus on 1-2 positions max
- Avoid options until account grows
- Use tight stop-losses
` : currentWallet < 25000 ? `
**Medium Account ($${currentWallet}):**
- Risk 2-3% per trade ($${(currentWallet * 0.03).toFixed(0)})
- Can hold 3-5 positions
- Options trading acceptable
- Diversify across sectors
` : `
**Large Account ($${currentWallet}):**
- Risk 1-2% per trade ($${(currentWallet * 0.02).toFixed(0)})
- Hold 5-10 positions
- Full options strategies available
- Consider professional management
`}

**Golden Rules:**
- Never risk more than you can afford to lose
- Don't put all money in one trade
- Keep 20-30% in cash for opportunities

Would you like specific position sizing recommendations?`;
        }

        if (lowerMessage.includes('pattern') || lowerMessage.includes('chart')) {
            return `## Chart Pattern Analysis 📈

**Common Patterns & Meanings:**

**Bullish Patterns:**
- **Head & Shoulders Bottom**: Reversal from downtrend
- **Double Bottom**: Strong support level identified
- **Ascending Triangle**: Continuation of uptrend
- **Cup & Handle**: Long-term bullish breakout

**Bearish Patterns:**
- **Head & Shoulders Top**: Reversal from uptrend  
- **Double Top**: Strong resistance level identified
- **Descending Triangle**: Continuation of downtrend
- **Rising Wedge**: Bearish divergence signal

**Pattern Reliability:**
- **High**: Multiple confirmations, clear formation
- **Medium**: Some uncertainty, mixed signals
- **Low**: Incomplete formation, conflicting data

**Trading Pattern Breakouts:**
- Wait for volume confirmation
- Set stop-loss below pattern support
- Target = pattern height added to breakout point

Patterns work best when combined with other technical indicators!`;
        }

        // Default response for unrecognized queries
        return `## I'm here to help! 🤝

I didn't quite understand your question, but I can help with:

**📊 Technical Analysis:**
- Indicator selection and interpretation
- Timeframe optimization
- Pattern recognition

**💰 Risk Management:**
- Position sizing
- Wallet allocation
- Stop-loss strategies

**📈 Results Interpretation:**
- Confidence levels
- Buy/sell/hold signals
- Options analysis

**🔧 Setup Optimization:**
- Best practices for your account size
- Market selection guidance
- Analysis customization

Try asking something like:
- "What's the best timeframe for swing trading?"
- "How do I interpret RSI signals?"
- "What should my position size be?"
- "Explain my analysis results"

What specific topic interests you most?`;
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

        // Simulate thinking time
        setTimeout(async () => {
            const response = await generateResponse(inputMessage);
            const botMessage: ChatMessage = {
                id: Date.now().toString() + '-bot',
                type: 'bot',
                content: response,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, botMessage]);
            setIsThinking(false);
        }, 1000 + Math.random() * 2000);
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
                            <span className="text-white font-bold text-lg">S</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Signatex Assistant
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Your AI Trading Guide
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
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
                                    <span className="text-sm text-gray-500">Signatex is thinking...</span>
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
                            placeholder="Ask me about technical indicators, risk management, or how to interpret your results..."
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
