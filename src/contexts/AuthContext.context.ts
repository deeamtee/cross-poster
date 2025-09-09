import { createContext } from 'react';
import type { User, AuthCredentials, AuthResult } from '../types';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (credentials: AuthCredentials) => Promise<AuthResult>;
  signUp: (credentials: AuthCredentials) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);