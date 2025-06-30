
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { X, Send, Users, MessageCircle, TrendingUp, TrendingDown, Zap, RotateCcw, Clock, Shield, Ban, UserX, AlertTriangle, Trash2 } from 'lucide-react';

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
  const { 
    user, 
    userProfile, 
    sendMessage, 
    loadMessages, 
    subscribeToMessages, 
    isUserAdmin,
    kickUserFromChannel,
    banUserFromChannel,
    banUserGlobally,
    unbanUser,
    deleteMessage
  } = useAuth();
  const [activeChannel, setActiveChannel] = useState('swing');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [moderationAction, setModerationAction] = useState<'kick' | 'ban_channel' | 'ban_global' | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [banDuration, setBanDuration] = useState(24);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [deletionReason, setDeletionReason] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Check admin status
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const adminStatus = await isUserAdmin();
        setIsAdmin(adminStatus);
      }
    };
    checkAdminStatus();
  }, [user, isUserAdmin]);

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

  const handleModerationAction = async () => {
    if (!selectedUser || !moderationAction) return;

    try {
      switch (moderationAction) {
        case 'kick':
          await kickUserFromChannel(selectedUser, activeChannel, moderationReason);
          break;
        case 'ban_channel':
          await banUserFromChannel(selectedUser, activeChannel, banDuration, moderationReason);
          break;
        case 'ban_global':
          await banUserGlobally(selectedUser, banDuration, moderationReason);
          break;
      }
      
      setSelectedUser(null);
      setModerationAction(null);
      setModerationReason('');
      setBanDuration(24);
      
      // Reload messages to show moderation action
      await loadChannelMessages();
    } catch (error) {
      console.error('Moderation action failed:', error);
      alert(`Failed to ${moderationAction.replace('_', ' ')}: ${error}`);
    }
  };

  const openModerationMenu = (userId: string, userName: string, actionType: 'kick' | 'ban_channel' | 'ban_global') => {
    if (!isAdmin || userId === user?.uid) return;
    
    setSelectedUser(userId);
    setModerationAction(actionType);
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      await deleteMessage(activeChannel, messageToDelete, deletionReason);
      setMessageToDelete(null);
      setDeletionReason('');
      
      // Reload messages to show updated list
      await loadChannelMessages();
    } catch (error) {
      console.error('Delete message failed:', error);
      alert(`Failed to delete message: ${error}`);
    }
  };

  const openDeleteMessageModal = (messageId: string) => {
    if (!isAdmin) return;
    setMessageToDelete(messageId);
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl h-[100vh] flex flex-col">
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
            <X className="w-5 h-5 text-red-500" />
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
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 min-h-[80px]">
              <div className="flex items-center justify-between h-full">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const channel = TRADING_CHANNELS.find(c => c.id === activeChannel);
                    const Icon = channel?.icon || MessageCircle;
                    return (
                      <>
                        <div className={`p-2 rounded-lg ${channel?.color || 'bg-gray-500'} flex-shrink-0`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                            {channel?.name || 'Unknown Channel'}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {channel?.description || 'Trading discussion'}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                {isAdmin && (
                  <div className="flex items-center space-x-2 bg-red-100 dark:bg-red-900 px-3 py-1 rounded-full flex-shrink-0">
                    <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">Admin</span>
                  </div>
                )}
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
                            className={`group relative ${
                              message.userId === 'system' ? 'flex justify-center' : 
                              message.userId === user?.uid ? 'flex justify-end' : 'flex justify-start'
                            }`}
                          >
                            {message.userId === 'system' ? (
                              <div className="text-center">
                                <div className="inline-block p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm">
                                  {message.content}
                                </div>
                              </div>
                            ) : (
                              <div className={`flex items-start space-x-3 max-w-[75%] ${
                                message.userId === user?.uid ? 'flex-row-reverse space-x-reverse' : ''
                              }`}>
                                <img
                                  src={message.userPhoto}
                                  alt={message.userName}
                                  className="w-8 h-8 rounded-full flex-shrink-0"
                                />
                                <div className={`flex flex-col ${
                                  message.userId === user?.uid ? 'items-end' : 'items-start'
                                }`}>
                                  <div className={`flex items-center space-x-2 mb-1 ${
                                    message.userId === user?.uid ? 'flex-row-reverse space-x-reverse' : ''
                                  }`}>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {message.userName}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatTime(message.timestamp)}
                                    </span>
                                    {isAdmin && (
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                        <button
                                          onClick={() => openDeleteMessageModal(message.id)}
                                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
                                          title="Delete message"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                        {message.userId !== user?.uid && (
                                          <>
                                            <button
                                              onClick={() => openModerationMenu(message.userId, message.userName, 'kick')}
                                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
                                              title="Kick user"
                                            >
                                              <UserX className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() => openModerationMenu(message.userId, message.userName, 'ban_channel')}
                                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
                                              title="Ban from channel"
                                            >
                                              <Ban className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() => openModerationMenu(message.userId, message.userName, 'ban_global')}
                                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
                                              title="Ban globally"
                                            >
                                              <AlertTriangle className="w-3 h-3" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div
                                    className={`inline-block p-3 rounded-lg ${
                                      message.userId === user?.uid
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                    }`}
                                  >
                                    {message.content}
                                  </div>
                                </div>
                              </div>
                            )}
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

      {/* Moderation Modal */}
      {moderationAction && selectedUser && (
        <div className="fixed inset-0 bg-black/70 z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {moderationAction === 'kick' ? 'Kick User' : 
                 moderationAction === 'ban_channel' ? 'Ban from Channel' : 'Global Ban'}
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason
                </label>
                <textarea
                  value={moderationReason}
                  onChange={(e) => setModerationReason(e.target.value)}
                  placeholder="Enter reason for moderation action..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              
              {moderationAction !== 'kick' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (hours)
                  </label>
                  <select
                    value={banDuration}
                    onChange={(e) => setBanDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={24}>24 hours</option>
                    <option value={72}>3 days</option>
                    <option value={168}>1 week</option>
                    <option value={720}>30 days</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setModerationAction(null);
                  setModerationReason('');
                  setBanDuration(24);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleModerationAction}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Confirm {moderationAction === 'kick' ? 'Kick' : 'Ban'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Deletion Modal */}
      {messageToDelete && (
        <div className="fixed inset-0 bg-black/70 z-[110] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Message
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="Enter reason for deletion..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setMessageToDelete(null);
                  setDeletionReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMessage}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
