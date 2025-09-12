import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import type { User, AuthCredentials, AuthResult, AuthError } from '../core/types';

// Firebase config loaded from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase app as singleton
const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Authentication service interface
 */
export interface AuthService {
  signUp(credentials: AuthCredentials): Promise<AuthResult>;
  signIn(credentials: AuthCredentials): Promise<AuthResult>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
  sendPasswordResetEmail(email: string): Promise<void>;
  updateProfile(user: User, profile: { displayName?: string; photoURL?: string }): Promise<User>;
  initialize(): Promise<void>;
}

/**
 * Firebase implementation of the AuthService
 */
class FirebaseAuthService implements AuthService {
  private auth;
  private initialized = false;

  constructor() {
    this.auth = getAuth(firebaseApp);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
  }

  private mapFirebaseUser(firebaseUser: FirebaseUser | null): User | null {
    if (!firebaseUser) return null;
    
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL
    };
  }

  private mapFirebaseError(error: any): AuthError {
    return {
      code: error.code || 'unknown',
      message: error.message || 'An unknown error occurred'
    };
  }

  async signUp(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth, 
        credentials.email, 
        credentials.password
      );
      
      return {
        user: this.mapFirebaseUser(userCredential.user),
        error: null
      };
    } catch (error) {
      return {
        user: null,
        error: this.mapFirebaseError(error)
      };
    }
  }

  async signIn(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth, 
        credentials.email, 
        credentials.password
      );
      
      return {
        user: this.mapFirebaseUser(userCredential.user),
        error: null
      };
    } catch (error) {
      return {
        user: null,
        error: this.mapFirebaseError(error)
      };
    }
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(this.auth);
  }

  async getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        unsubscribe();
        resolve(this.mapFirebaseUser(user));
      });
    });
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, (firebaseUser) => {
      callback(this.mapFirebaseUser(firebaseUser));
    });
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    await firebaseSendPasswordResetEmail(this.auth, email);
  }

  async updateProfile(user: User, profile: { displayName?: string; photoURL?: string }): Promise<User> {
    const currentUser = this.auth.currentUser;
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    try {
      await firebaseUpdateProfile(currentUser, profile);
      
      // Return updated user object
      return {
        ...user,
        displayName: profile.displayName || user.displayName || null,
        photoURL: profile.photoURL || user.photoURL || null
      };
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw new Error('Failed to update profile');
    }
  }
}

// Authentication service factory
class AuthServiceFactory {
  private static instance: AuthService | null = null;

  static getInstance(): AuthService {
    if (!this.instance) {
      this.instance = new FirebaseAuthService();
    }
    return this.instance;
  }

  static setInstance(service: AuthService): void {
    this.instance = service;
  }

  static reset(): void {
    this.instance = null;
  }
}

// Export the default instance
export const authService = AuthServiceFactory.getInstance();