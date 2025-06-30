import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, orderBy, limit, getDocs, deleteDoc } from 'firebase/firestore';

// Firebase configuration - replace with your actual config
const firebaseConfig = {
  apiKey: "AIzaSyAqsmue4lx8vALO5o08TdclI5uXI52BtOA",
  authDomain: "signatex-d1b11.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

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
      const result = await signInWithPopup(auth, googleProvider);
      this.currentUser = result.user;
      await this.createOrUpdateUserProfile(result.user);
      return result.user;
    } catch (error) {
      console.error('Google sign-in error:', error);
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
        maxAnalyses: 50
      };
      await setDoc(userRef, userProfile);
    } else {
      // Update last login
      await updateDoc(userRef, {
        lastLoginAt: new Date()
      });
    }
  }

  async getUserProfile(): Promise<UserProfile | null> {
    if (!this.currentUser) return null;

    const userRef = doc(db, 'users', this.currentUser.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
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

  // Analysis results management
  async saveAnalysisResults(results: any[], settings: CloudUserData): Promise<string> {
    if (!this.currentUser) throw new Error('User not authenticated');

    const userProfile = await this.getUserProfile();
    if (!userProfile) throw new Error('User profile not found');

    // Check if user has reached analysis limit
    if (userProfile.analysisCount >= userProfile.maxAnalyses) {
      throw new Error(`Analysis limit reached. Free users can save up to ${userProfile.maxAnalyses} analyses.`);
    }

    // Create analysis record
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const analysisRecord: AnalysisRecord = {
      id: analysisId,
      timestamp: new Date(),
      symbols: results.map(r => r.symbol?.symbol || ''),
      results,
      settings
    };

    // Save to Firestore
    const analysisRef = doc(db, 'analyses', this.currentUser.uid, 'userAnalyses', analysisId);
    await setDoc(analysisRef, analysisRecord);

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

  // Paper trading methods (placeholder for future implementation)
  async savePaperTrade(tradeData: any): Promise<string> {
    if (!this.currentUser) throw new Error('User not authenticated');

    const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const tradeRef = doc(db, 'paperTrades', this.currentUser.uid, 'trades', tradeId);

    await setDoc(tradeRef, {
      ...tradeData,
      id: tradeId,
      userId: this.currentUser.uid,
      timestamp: new Date(),
      status: 'active'
    });

    return tradeId;
  }

  async loadPaperTrades(): Promise<any[]> {
    if (!this.currentUser) return [];

    const tradesRef = collection(db, 'paperTrades', this.currentUser.uid, 'trades');
    const q = query(tradesRef, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => doc.data());
  }
}

export const firebaseService = FirebaseService.getInstance();