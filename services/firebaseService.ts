import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, orderBy, limit, getDocs, deleteDoc } from 'firebase/firestore';

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyAqsmue4lx8vALO5o08TdclI5uXI52BtOA",
  authDomain: "signatex-d1b11.firebaseapp.com",
  databaseURL: "https://signatex-d1b11-default-rtdb.firebaseio.com",
  projectId: "signatex-d1b11",
  storageBucket: "signatex-d1b11.firebasestorage.app",
  messagingSenderId: "470730639644",
  appId: "1:470730639644:web:a7fadaefc6446e676c12d9",
  measurementId: "G-SZXC86690S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Firestore settings
try {
  // Firestore automatically handles offline persistence in modern versions
  console.log('Firebase initialized successfully');
} catch (error) {
  console.log('Firebase initialization warning:', error);
}

// Admin configuration - Add UIDs of users who should have admin privileges
const ADMIN_UIDS = [
  // Add admin user IDs here
  // Example: 'abc123def456ghi789' (this is what a Firebase UID looks like)
  // Replace with your actual Firebase UID after signing in
  '7rLZwoI6yPPZJrpzpNVOjlVijcm2',
  'VNPQyMhEY7gxR2F4b63Pejy8rfg2'
];

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  lastLoginAt: Date;
  tier: 'free' | 'premium';
  analysisCount: number;
  maxAnalyses: number;
  isAdmin?: boolean;
  bannedFromChannels?: string[];
  bannedGlobally?: boolean;
  bannedUntil?: Date;
}

export interface CloudUserData {
  selectedSymbols: any[];
  walletAmount: string;
  selectedIndicators: string[];
  selectedNonTechnicalIndicators: string[];
  selectedTimeframe: string;
  selectedMarketType: string;
  selectedMarket: string;
  includeOptionsAnalysis: boolean;
  includeCallOptions: boolean;
  includePutOptions: boolean;
  includeOrderAnalysis: boolean;
  dates: { startDate: string; endDate: string };
  theme: string;
}

export interface AnalysisRecord {
  id: string;
  timestamp: Date;
  symbols: string[];
  results: any[];
  settings: CloudUserData;
}

export class FirebaseService {
  private static instance: FirebaseService;
  private currentUser: User | null = null;

  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  // Authentication methods
  async signInWithGoogle(): Promise<User> {
    try {
      // Try popup first
      const result = await signInWithPopup(auth, googleProvider);
      this.currentUser = result.user;
      await this.createOrUpdateUserProfile(result.user);
      return result.user;
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // If popup is blocked or fails due to CORS/cross-origin issues, use redirect
      if (error.code === 'auth/popup-blocked' || 
          error.code === 'auth/popup-closed-by-user' ||
          error.code === 'auth/cancelled-popup-request' ||
          error.message?.includes('Cross-Origin') ||
          error.message?.includes('popup')) {
        console.log('Popup authentication failed, using redirect method...');
        try {
          // Set a flag to indicate we're redirecting
          localStorage.setItem('auth_redirect_pending', 'true');
          await signInWithRedirect(auth, googleProvider);
          // This will redirect the page
          throw new Error('Redirecting for authentication...');
        } catch (redirectError) {
          console.error('Redirect sign-in error:', redirectError);
          localStorage.removeItem('auth_redirect_pending');
          throw redirectError;
        }
      }
      
      throw error;
    }
  }

  async signOutUser(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      callback(user);
    });
  }

  // Handle redirect result after page reload
  async handleRedirectResult(): Promise<User | null> {
    try {
      const result = await getRedirectResult(auth);
      if (result?.user) {
        this.currentUser = result.user;
        await this.createOrUpdateUserProfile(result.user);
        // Clear the redirect pending flag
        localStorage.removeItem('auth_redirect_pending');
        return result.user;
      }
      // Clear redirect pending flag if no result
      localStorage.removeItem('auth_redirect_pending');
      return null;
    } catch (error) {
      console.error('Redirect result error:', error);
      localStorage.removeItem('auth_redirect_pending');
      throw error;
    }
  }

  // Check if authentication redirect is pending
  isAuthRedirectPending(): boolean {
    return localStorage.getItem('auth_redirect_pending') === 'true';
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // User profile management
  private async createOrUpdateUserProfile(user: User): Promise<void> {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create new user profile
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || undefined,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        tier: 'free',
        analysisCount: 0,
        maxAnalyses: 50,
        isAdmin: ADMIN_UIDS.includes(user.uid),
        bannedFromChannels: [],
        bannedGlobally: false
      };
      await setDoc(userRef, userProfile);
    } else {
      // Update last login and admin status
      await updateDoc(userRef, {
        lastLoginAt: new Date(),
        isAdmin: ADMIN_UIDS.includes(user.uid)
      });
    }
  }

  async getUserProfile(): Promise<UserProfile | null> {
    if (!this.currentUser) return null;

    try {
      const userRef = doc(db, 'users', this.currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error: any) {
      console.error('Failed to get user profile:', error);
      
      // Return a default profile if offline
      if (error.code === 'unavailable' || error.message?.includes('offline')) {
        return {
          uid: this.currentUser.uid,
          email: this.currentUser.email || '',
          displayName: this.currentUser.displayName || '',
          photoURL: this.currentUser.photoURL || undefined,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          tier: 'free',
          analysisCount: 0,
          maxAnalyses: 50
        };
      }
      
      throw error;
    }
  }

  // Data synchronization methods
  async saveUserData(data: CloudUserData): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    const userDataRef = doc(db, 'userData', this.currentUser.uid);
    await setDoc(userDataRef, {
      ...data,
      lastUpdated: new Date()
    });
  }

  async loadUserData(): Promise<CloudUserData | null> {
    if (!this.currentUser) return null;

    const userDataRef = doc(db, 'userData', this.currentUser.uid);
    const userDataDoc = await getDoc(userDataRef);

    if (userDataDoc.exists()) {
      const data = userDataDoc.data();
      delete data.lastUpdated; // Remove timestamp
      return data as CloudUserData;
    }
    return null;
  }

  // Helper function to remove undefined values from objects
  private cleanObjectForFirestore(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanObjectForFirestore(item));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.cleanObjectForFirestore(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  // Analysis results management
  async saveAnalysisResults(results: any[], settings: CloudUserData): Promise<string> {
    if (!this.currentUser) throw new Error('User not authenticated');

    const userProfile = await this.getUserProfile();
    if (!userProfile) throw new Error('User profile not found');

    // Check if user has reached analysis limit
    if (userProfile.analysisCount >= userProfile.maxAnalyses) {
      throw new Error(`Analysis limit reached. Free users can save up to ${userProfile.maxAnalyses} analyses.`);
    }

    // Clean results and settings to remove undefined values
    const cleanedResults = this.cleanObjectForFirestore(results);
    const cleanedSettings = this.cleanObjectForFirestore(settings);

    // Create analysis record
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const analysisRecord: AnalysisRecord = {
      id: analysisId,
      timestamp: new Date(),
      symbols: cleanedResults.map((r: any) => r.symbol?.symbol || '').filter(Boolean),
      results: cleanedResults,
      settings: cleanedSettings
    };

    // Clean the entire record to ensure no undefined values
    const cleanedRecord = this.cleanObjectForFirestore(analysisRecord);

    // Save to Firestore
    const analysisRef = doc(db, 'analyses', this.currentUser.uid, 'userAnalyses', analysisId);
    await setDoc(analysisRef, cleanedRecord);

    // Update user's analysis count
    const userRef = doc(db, 'users', this.currentUser.uid);
    await updateDoc(userRef, {
      analysisCount: userProfile.analysisCount + 1
    });

    return analysisId;
  }

  async loadAnalysisHistory(): Promise<AnalysisRecord[]> {
    if (!this.currentUser) return [];

    const analysesRef = collection(db, 'analyses', this.currentUser.uid, 'userAnalyses');
    const q = query(analysesRef, orderBy('timestamp', 'desc'), limit(50));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => doc.data() as AnalysisRecord);
  }

  async deleteAnalysis(analysisId: string): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    const analysisRef = doc(db, 'analyses', this.currentUser.uid, 'userAnalyses', analysisId);
    await deleteDoc(analysisRef);

    // Decrease user's analysis count
    const userProfile = await this.getUserProfile();
    if (userProfile && userProfile.analysisCount > 0) {
      const userRef = doc(db, 'users', this.currentUser.uid);
      await updateDoc(userRef, {
        analysisCount: userProfile.analysisCount - 1
      });
    }
  }

  // Admin methods
  async isUserAdmin(): Promise<boolean> {
    if (!this.currentUser) return false;
    const userProfile = await this.getUserProfile();
    return userProfile?.isAdmin || false;
  }

  async kickUserFromChannel(targetUserId: string, channel: string, reason?: string): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');
    
    const isAdmin = await this.isUserAdmin();
    if (!isAdmin) throw new Error('Insufficient permissions');

    // Add a kick record
    const kickRef = doc(db, 'moderation', 'kicks', 'records', `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    await setDoc(kickRef, {
      targetUserId,
      adminUserId: this.currentUser.uid,
      adminUserName: this.currentUser.displayName || 'Admin',
      channel,
      reason: reason || 'No reason provided',
      timestamp: new Date(),
      type: 'kick'
    });

    // Send a system message about the kick
    const systemMessageRef = doc(db, 'chatrooms', channel, 'messages', `kick_${Date.now()}`);
    await setDoc(systemMessageRef, {
      id: `kick_${Date.now()}`,
      userId: 'system',
      userName: 'System',
      userPhoto: '',
      content: `User was kicked from the channel. Reason: ${reason || 'No reason provided'}`,
      timestamp: new Date(),
      channel: channel,
      isSystemMessage: true,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
    });
  }

  async banUserFromChannel(targetUserId: string, channel: string, duration: number = 24, reason?: string): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');
    
    const isAdmin = await this.isUserAdmin();
    if (!isAdmin) throw new Error('Insufficient permissions');

    const targetUserRef = doc(db, 'users', targetUserId);
    const targetUserDoc = await getDoc(targetUserRef);
    
    if (targetUserDoc.exists()) {
      const userData = targetUserDoc.data() as UserProfile;
      const bannedChannels = userData.bannedFromChannels || [];
      
      if (!bannedChannels.includes(channel)) {
        bannedChannels.push(channel);
      }

      await updateDoc(targetUserRef, {
        bannedFromChannels: bannedChannels,
        bannedUntil: new Date(Date.now() + duration * 60 * 60 * 1000) // duration in hours
      });
    }

    // Add a ban record
    const banRef = doc(db, 'moderation', 'bans', 'records', `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    await setDoc(banRef, {
      targetUserId,
      adminUserId: this.currentUser.uid,
      adminUserName: this.currentUser.displayName || 'Admin',
      channel,
      duration,
      reason: reason || 'No reason provided',
      timestamp: new Date(),
      type: 'channel_ban'
    });

    // Send a system message about the ban
    const systemMessageRef = doc(db, 'chatrooms', channel, 'messages', `ban_${Date.now()}`);
    await setDoc(systemMessageRef, {
      id: `ban_${Date.now()}`,
      userId: 'system',
      userName: 'System',
      userPhoto: '',
      content: `User was banned from the channel for ${duration} hours. Reason: ${reason || 'No reason provided'}`,
      timestamp: new Date(),
      channel: channel,
      isSystemMessage: true,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
    });
  }

  async banUserGlobally(targetUserId: string, duration: number = 24, reason?: string): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');
    
    const isAdmin = await this.isUserAdmin();
    if (!isAdmin) throw new Error('Insufficient permissions');

    const targetUserRef = doc(db, 'users', targetUserId);
    await updateDoc(targetUserRef, {
      bannedGlobally: true,
      bannedUntil: new Date(Date.now() + duration * 60 * 60 * 1000)
    });

    // Add a global ban record
    const banRef = doc(db, 'moderation', 'bans', 'records', `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    await setDoc(banRef, {
      targetUserId,
      adminUserId: this.currentUser.uid,
      adminUserName: this.currentUser.displayName || 'Admin',
      duration,
      reason: reason || 'No reason provided',
      timestamp: new Date(),
      type: 'global_ban'
    });
  }

  async unbanUser(targetUserId: string, channel?: string): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');
    
    const isAdmin = await this.isUserAdmin();
    if (!isAdmin) throw new Error('Insufficient permissions');

    const targetUserRef = doc(db, 'users', targetUserId);
    const targetUserDoc = await getDoc(targetUserRef);
    
    if (targetUserDoc.exists()) {
      const userData = targetUserDoc.data() as UserProfile;
      
      if (channel) {
        // Unban from specific channel
        const bannedChannels = (userData.bannedFromChannels || []).filter(c => c !== channel);
        await updateDoc(targetUserRef, {
          bannedFromChannels: bannedChannels
        });
      } else {
        // Global unban
        await updateDoc(targetUserRef, {
          bannedGlobally: false,
          bannedFromChannels: [],
          bannedUntil: null
        });
      }
    }
  }

  async checkUserBanStatus(channel: string): Promise<boolean> {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    const userProfile = await this.getUserProfile();
    if (!userProfile) return false;

    // Check global ban
    if (userProfile.bannedGlobally) {
      if (userProfile.bannedUntil && new Date() > userProfile.bannedUntil) {
        // Ban expired, remove it
        await this.unbanUser(currentUser.uid);
        return false;
      }
      return true;
    }

    // Check channel-specific ban
    if (userProfile.bannedFromChannels?.includes(channel)) {
      if (userProfile.bannedUntil && new Date() > userProfile.bannedUntil) {
        // Ban expired, remove it
        await this.unbanUser(currentUser.uid, channel);
        return false;
      }
      return true;
    }

    return false;
  }

  // Chatroom methods
  async sendMessage(channel: string, content: string): Promise<string> {
    // Use auth.currentUser instead of this.currentUser for real-time auth state
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    // Check if user is banned from this channel
    const isBanned = await this.checkUserBanStatus(channel);
    if (isBanned) {
      throw new Error('You are banned from this channel');
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const messageRef = doc(db, 'chatrooms', channel, 'messages', messageId);

    const messageData = {
      id: messageId,
      userId: currentUser.uid,
      userName: currentUser.displayName || 'Anonymous',
      userPhoto: currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'User')}&background=3b82f6&color=fff`,
      content: content.trim(),
      timestamp: new Date(),
      channel: channel,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
    };

    await setDoc(messageRef, messageData);
    return messageId;
  }

  async loadMessages(channel: string): Promise<any[]> {
    try {
      const messagesRef = collection(db, 'chatrooms', channel, 'messages');
      const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
      
      const q = query(
        messagesRef, 
        orderBy('timestamp', 'desc'), 
        limit(100)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Filter out expired messages and return in chronological order
      return querySnapshot.docs
        .map(doc => doc.data())
        .filter(message => message.timestamp.toDate() > cutoffTime)
        .reverse(); // Show oldest first
    } catch (error: any) {
      console.error('Error loading messages:', error);
      
      // If permissions error, return empty array instead of throwing
      if (error.code === 'permission-denied') {
        console.warn('Permission denied for loading messages. Check Firestore security rules.');
        return [];
      }
      
      throw error;
    }
  }

  // Subscribe to real-time messages for a channel
  subscribeToMessages(channel: string, callback: (messages: any[]) => void): () => void {
    const messagesRef = collection(db, 'chatrooms', channel, 'messages');
    const cutoffTime = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    const q = query(
      messagesRef,
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    // Note: In a real implementation, you'd use onSnapshot from Firebase
    // For now, we'll simulate real-time updates with polling
    const intervalId = setInterval(async () => {
      try {
        const messages = await this.loadMessages(channel);
        callback(messages);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(intervalId);
  }

  // Admin method to delete messages
  async deleteMessage(channel: string, messageId: string, reason?: string): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');
    
    const isAdmin = await this.isUserAdmin();
    if (!isAdmin) throw new Error('Insufficient permissions');

    // Delete the message from Firestore
    const messageRef = doc(db, 'chatrooms', channel, 'messages', messageId);
    await deleteDoc(messageRef);

    // Log the deletion for audit purposes
    const deletionRef = doc(db, 'moderation', 'deletions', 'records', `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    await setDoc(deletionRef, {
      messageId,
      adminUserId: this.currentUser.uid,
      adminUserName: this.currentUser.displayName || 'Admin',
      channel,
      reason: reason || 'No reason provided',
      timestamp: new Date(),
      type: 'message_deletion'
    });

    // Optional: Send a system message about the deletion
    if (reason) {
      const systemMessageRef = doc(db, 'chatrooms', channel, 'messages', `deletion_${Date.now()}`);
      await setDoc(systemMessageRef, {
        id: `deletion_${Date.now()}`,
        userId: 'system',
        userName: 'System',
        userPhoto: '',
        content: `A message was removed by admin. Reason: ${reason}`,
        timestamp: new Date(),
        channel: channel,
        isSystemMessage: true,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
      });
    }
  }

  // Paper trading methods
  async savePaperTrade(tradeData: any): Promise<string> {
    if (!this.currentUser) throw new Error('User not authenticated');

    const tradeRef = doc(db, 'paperTrades', this.currentUser.uid, 'trades', tradeData.id);
    const cleanedTradeData = this.cleanObjectForFirestore(tradeData);

    await setDoc(tradeRef, cleanedTradeData);
    return tradeData.id;
  }

  async loadPaperTrades(): Promise<any[]> {
    if (!this.currentUser) return [];

    try {
      const tradesRef = collection(db, 'paperTrades', this.currentUser.uid, 'trades');
      const q = query(tradesRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
          closedAt: data.closedAt?.toDate ? data.closedAt.toDate() : null,
          expirationDate: data.expirationDate?.toDate ? data.expirationDate.toDate() : data.expirationDate
        };
      });
    } catch (error) {
      console.error('Error loading paper trades:', error);
      return [];
    }
  }

  async loadPaperTrade(tradeId: string): Promise<any | null> {
    if (!this.currentUser) return null;

    try {
      const tradeRef = doc(db, 'paperTrades', this.currentUser.uid, 'trades', tradeId);
      const tradeDoc = await getDoc(tradeRef);

      if (tradeDoc.exists()) {
        const data = tradeDoc.data();
        return {
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
          closedAt: data.closedAt?.toDate ? data.closedAt.toDate() : null,
          expirationDate: data.expirationDate?.toDate ? data.expirationDate.toDate() : data.expirationDate
        };
      }
      return null;
    } catch (error) {
      console.error('Error loading paper trade:', error);
      return null;
    }
  }

  async savePaperTradingPortfolio(portfolio: any): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    const portfolioRef = doc(db, 'paperTradingPortfolios', this.currentUser.uid);
    const cleanedPortfolio = this.cleanObjectForFirestore(portfolio);

    await setDoc(portfolioRef, cleanedPortfolio);
  }

  async loadPaperTradingPortfolio(): Promise<any | null> {
    if (!this.currentUser) return null;

    try {
      const portfolioRef = doc(db, 'paperTradingPortfolios', this.currentUser.uid);
      const portfolioDoc = await getDoc(portfolioRef);

      if (portfolioDoc.exists()) {
        const data = portfolioDoc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
          positions: (data.positions || []).map((pos: any) => ({
            ...pos,
            expirationDate: pos.expirationDate?.toDate ? pos.expirationDate.toDate() : pos.expirationDate
          }))
        };
      }
      return null;
    } catch (error) {
      console.error('Error loading paper trading portfolio:', error);
      return null;
    }
  }

  async deletePaperTradingData(): Promise<void> {
    if (!this.currentUser) throw new Error('User not authenticated');

    try {
      // Delete all trades
      const tradesRef = collection(db, 'paperTrades', this.currentUser.uid, 'trades');
      const tradesSnapshot = await getDocs(tradesRef);
      
      const deletePromises = tradesSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Delete portfolio
      const portfolioRef = doc(db, 'paperTradingPortfolios', this.currentUser.uid);
      await deleteDoc(portfolioRef);
    } catch (error) {
      console.error('Error deleting paper trading data:', error);
      throw error;
    }
  }
}

export const firebaseService = FirebaseService.getInstance();