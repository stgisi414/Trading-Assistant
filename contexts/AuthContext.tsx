import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { firebaseService, UserProfile, CloudUserData } from '../services/firebaseService.ts';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthRedirectPending: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  saveDataToCloud: (data: CloudUserData) => Promise<void>;
  loadDataFromCloud: () => Promise<CloudUserData | null>;
  saveAnalysis: (results: any[], settings: CloudUserData) => Promise<string>;
  loadAnalysisHistory: () => Promise<any[]>;
  deleteAnalysis: (analysisId: string) => Promise<void>;
  sendMessage: (channel: string, content: string) => Promise<string>;
  loadMessages: (channel: string) => Promise<any[]>;
  subscribeToMessages: (channel: string, callback: (messages: any[]) => void) => () => void;
  isUserAdmin: () => Promise<boolean>;
  kickUserFromChannel: (targetUserId: string, channel: string, reason?: string) => Promise<void>;
  banUserFromChannel: (targetUserId: string, channel: string, duration?: number, reason?: string) => Promise<void>;
  banUserGlobally: (targetUserId: string, duration?: number, reason?: string) => Promise<void>;
  unbanUser: (targetUserId: string, channel?: string) => Promise<void>;
  deleteMessage: (channel: string, messageId: string, reason?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        // Return a default context instead of throwing error during development
        console.warn('useAuth called outside AuthProvider, returning default values');
        return {
            user: null,
            userProfile: null,
            isLoading: false,
            isAuthRedirectPending: false,
            signIn: async () => {},
            signOut: async () => {},
            saveDataToCloud: async () => {},
            loadDataFromCloud: async () => null,
            saveAnalysis: async () => "",
            loadAnalysisHistory: async () => [],
            deleteAnalysis: async () => {},
            sendMessage: async () => "",
            loadMessages: async () => [],
            subscribeToMessages: () => () => {},
            isUserAdmin: async () => false,
            kickUserFromChannel: async () => {},
            banUserFromChannel: async () => {},
            banUserGlobally: async () => {},
            unbanUser: async () => {},
            deleteMessage: async () => {}
        };
    }
    return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthRedirectPending, setIsAuthRedirectPending] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check if redirect is pending
      setIsAuthRedirectPending(firebaseService.isAuthRedirectPending());

      // First check for redirect result
      try {
        const result = await firebaseService.handleRedirectResult();
        if (result) {
          console.log('Authentication successful via redirect');
        }
      } catch (error) {
        console.error('Error handling redirect result:', error);
      } finally {
        setIsAuthRedirectPending(false);
      }
    };

    initializeAuth();

    const unsubscribe = firebaseService.onAuthStateChange(async (user) => {
      setUser(user);
      if (user) {
        const profile = await firebaseService.getUserProfile();
        setUserProfile(profile);
        setIsAuthRedirectPending(false);
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      setIsLoading(true);
      await firebaseService.signInWithGoogle();
    } catch (error: any) {
      console.error('Sign-in error:', error);

      // Don't show error for redirect case
      if (error.message !== 'Redirecting for authentication...') {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await firebaseService.signOutUser();
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const saveDataToCloud = async (data: CloudUserData) => {
    await firebaseService.saveUserData(data);
  };

  const loadDataFromCloud = async () => {
    return await firebaseService.loadUserData();
  };

  const saveAnalysis = async (results: any[], settings: CloudUserData) => {
    const analysisId = await firebaseService.saveAnalysisResults(results, settings);
    // Refresh user profile to update analysis count
    if (user) {
      const updatedProfile = await firebaseService.getUserProfile();
      setUserProfile(updatedProfile);
    }
    return analysisId;
  };

  const loadAnalysisHistory = async () => {
    return await firebaseService.loadAnalysisHistory();
  };

  const deleteAnalysis = async (analysisId: string) => {
    if (!firebaseService.getCurrentUser()) {
      throw new Error('User not authenticated');
    }

    await firebaseService.deleteAnalysis(analysisId);

    // Refresh user profile to update analysis count
    const updatedProfile = await firebaseService.getUserProfile();
    if (updatedProfile) {
      setUserProfile(updatedProfile);
    }
  };

  const sendMessage = async (channel: string, content: string) => {
    return await firebaseService.sendMessage(channel, content);
  };

  const loadMessages = async (channel: string) => {
    return await firebaseService.loadMessages(channel);
  };

  const subscribeToMessages = (channel: string, callback: (messages: any[]) => void) => {
    return firebaseService.subscribeToMessages(channel, callback);
  };

  const isUserAdmin = async () => {
    return await firebaseService.isUserAdmin();
  };

  const kickUserFromChannel = async (targetUserId: string, channel: string, reason?: string) => {
    await firebaseService.kickUserFromChannel(targetUserId, channel, reason);
  };

  const banUserFromChannel = async (targetUserId: string, channel: string, duration: number = 24, reason?: string) => {
    await firebaseService.banUserFromChannel(targetUserId, channel, duration, reason);
  };

  const banUserGlobally = async (targetUserId: string, duration: number = 24, reason?: string) => {
    await firebaseService.banUserGlobally(targetUserId, duration, reason);
  };

  const unbanUser = async (targetUserId: string, channel?: string) => {
    await firebaseService.unbanUser(targetUserId, channel);
  };

  const deleteMessage = async (channel: string, messageId: string, reason?: string) => {
    await firebaseService.deleteMessage(channel, messageId, reason);
  };

  const value: AuthContextType = {
    user,
    userProfile,
    isLoading,
    isAuthRedirectPending,
    signIn,
    signOut,
    saveDataToCloud,
    loadDataFromCloud,
    saveAnalysis,
    loadAnalysisHistory,
    deleteAnalysis,
    sendMessage,
    loadMessages,
    subscribeToMessages,
    isUserAdmin,
    kickUserFromChannel,
    banUserFromChannel,
    banUserGlobally,
    unbanUser,
    deleteMessage
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};