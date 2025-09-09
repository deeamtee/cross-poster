import React, { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/auth';
import type { User, AuthCredentials, AuthResult } from '../types';
import { AuthContext } from './AuthContext.context';
import type { AuthContextType } from './AuthContext.context';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth service
    authService.initialize();

    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const signIn = async (credentials: AuthCredentials): Promise<AuthResult> => {
    setLoading(true);
    try {
      const result = await authService.signIn(credentials);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (credentials: AuthCredentials): Promise<AuthResult> => {
    setLoading(true);
    try {
      const result = await authService.signUp(credentials);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await authService.signOut();
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordResetEmail = async (email: string): Promise<void> => {
    await authService.sendPasswordResetEmail(email);
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    sendPasswordResetEmail,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};