
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { X, Send, Users, MessageCircle, TrendingUp, TrendingDown, Zap, RotateCcw, Clock } from 'lucide-react';

interface Message {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  content: string;
  timestamp: Date;
  channel: string;
}

interface ChatroomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TRADING_CHANNELS = [
  { id: 'swing', name: 'Swing Trade', icon: TrendingUp, color: 'bg-blue-500', description: 'Multi-day position trading' },
  { id: 'buy-hold', name: 'Buy & Hold', icon: Clock, color: 'bg-green-500', description: 'Long-term investment strategy' },
  { id: 'momentum', name: 'Momentum Trade', icon: Zap, color: 'bg-yellow-500', description: 'High-momentum trading' },
  { id: 'reversal', name: 'Reversal Trade', icon: RotateCcw, color: 'bg-purple-500', description: 'Counter-trend trading' },
  { id: 'scalp', name: 'Scalp', icon: TrendingDown, color: 'bg-red-500', description: 'Quick scalping trades' }
];

export const ChatroomModal: React.FC<ChatroomModalProps> = ({ isOpen, onClose }) => {
  const { user, sendMessage, loadMessages, subscribeToMessages } = useAuth();
  const [activeChannel, setActiveChannel] = useState('swing');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Load messages when channel changes or modal opens
  useEffect(() => {
    if (isOpen && user) {
      loadChannelMessages();
      
      // Subscribe to real-time updates
      unsubscribeRef.current = subscribeToMessages(activeChannel, (newMessages) => {
        setMessages(newMessages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp)
        })));
      });

      // Simulate online users (in a real app, you'd track this in Firebase)
      setOnlineUsers(Math.floor(Math.random() * 50) + 10);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [isOpen, activeChannel, user]);

  const loadChannelMessages = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const channelMessages = await loadMessages(activeChannel);
      setMessages(channelMessages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp)
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(activeChannel, newMessage.trim());
      setNewMessage('');
      inputRef.current?.focus();
      
      // Reload messages to get the latest
      await loadChannelMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, message) => {
    const dateKey = message.timestamp.toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {});

  if (!isOpen) return null;

  if (!user) {
    return createPortal(
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
          <MessageCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Sign In Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please sign in to join the trading chatrooms and connect with other traders.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Trading Chatrooms
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Messages expire after 48 hours
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Channel Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Trading Channels
            </h3>
            <div className="space-y-2">
              {TRADING_CHANNELS.map((channel) => {
                const Icon = channel.icon;
                return (
                  <button
                    key={channel.id}
                    onClick={() => setActiveChannel(channel.id)}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${
                      activeChannel === channel.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className={`p-1 rounded ${channel.color}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium">{channel.name}</div>
                      <div className="text-xs opacity-75">{channel.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Online Users */}
            <div className="mt-6 p-3 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {onlineUsers} online
                </span>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Channel Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                {(() => {
                  const channel = TRADING_CHANNELS.find(c => c.id === activeChannel);
                  const Icon = channel?.icon || MessageCircle;
                  return (
                    <>
                      <div className={`p-2 rounded-lg ${channel?.color || 'bg-gray-500'}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {channel?.name || 'Unknown Channel'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {channel?.description || 'Trading discussion'}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Loading messages...</span>
                </div>
              ) : Object.keys(groupedMessages).length === 0 ? (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No messages yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Be the first to start the conversation in {TRADING_CHANNELS.find(c => c.id === activeChannel)?.name}!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedMessages).map(([dateKey, dayMessages]) => (
                    <div key={dateKey}>
                      {/* Date separator */}
                      <div className="flex items-center justify-center mb-4">
                        <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                            {formatDate(new Date(dateKey))}
                          </span>
                        </div>
                      </div>
                      
                      {/* Messages for this date */}
                      <div className="space-y-4">
                        {dayMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex space-x-3 ${
                              message.userId === user?.uid ? 'flex-row-reverse space-x-reverse' : ''
                            }`}
                          >
                            <img
                              src={message.userPhoto}
                              alt={message.userName}
                              className="w-8 h-8 rounded-full flex-shrink-0"
                            />
                            <div
                              className={`flex-1 ${
                                message.userId === user?.uid ? 'text-right' : ''
                              }`}
                            >
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {message.userName}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTime(message.timestamp)}
                                </span>
                              </div>
                              <div
                                className={`inline-block p-3 rounded-lg max-w-xs lg:max-w-md ${
                                  message.userId === user?.uid
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                }`}
                              >
                                {message.content}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message ${TRADING_CHANNELS.find(c => c.id === activeChannel)?.name}...`}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={isSending}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                >
                  {isSending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {isSending ? 'Sending...' : 'Send'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
