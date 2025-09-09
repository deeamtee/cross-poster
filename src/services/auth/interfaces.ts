import type { User, AuthCredentials, AuthResult } from '../../types';

/**
 * Abstract authentication service interface
 * This allows easy replacement of Firebase with custom auth service
 */
export interface AuthService {
  // Authentication methods
  signUp(credentials: AuthCredentials): Promise<AuthResult>;
  signIn(credentials: AuthCredentials): Promise<AuthResult>;
  signOut(): Promise<void>;
  
  // User state
  getCurrentUser(): Promise<User | null>;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
  
  // Password management
  sendPasswordResetEmail(email: string): Promise<void>;
  
  // Service initialization
  initialize(): Promise<void>;
}

/**
 * Authentication events that can be subscribed to
 */
export interface AuthEvents {
  userChanged: (user: User | null) => void;
  signInSuccess: (user: User) => void;
  signInError: (error: Error) => void;
  signOutSuccess: () => void;
}