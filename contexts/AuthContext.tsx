
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { firebaseService, UserProfile, CloudUserData } from '../services/firebaseService.ts';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  saveDataToCloud: (data: CloudUserData) => Promise<void>;
  loadDataFromCloud: () => Promise<CloudUserData | null>;
  saveAnalysis: (results: any[], settings: CloudUserData) => Promise<string>;
  loadAnalysisHistory: () => Promise<any[]>;
  deleteAnalysis: (analysisId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
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

  useEffect(() => {
    const initializeAuth = async () => {
      // First check for redirect result
      try {
        await firebaseService.handleRedirectResult();
      } catch (error) {
        console.error('Error handling redirect result:', error);
      }
    };

    initializeAuth();

    const unsubscribe = firebaseService.onAuthStateChange(async (user) => {
      setUser(user);
      if (user) {
        const profile = await firebaseService.getUserProfile();
        setUserProfile(profile);
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
    return await firebaseService.saveAnalysisResults(results, settings);
  };

  const loadAnalysisHistory = async () => {
    return await firebaseService.loadAnalysisHistory();
  };

  const deleteAnalysis = async (analysisId: string) => {
    await firebaseService.deleteAnalysis(analysisId);
  };

  const value: AuthContextType = {
    user,
    userProfile,
    isLoading,
    signIn,
    signOut,
    saveDataToCloud,
    loadDataFromCloud,
    saveAnalysis,
    loadAnalysisHistory,
    deleteAnalysis
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
