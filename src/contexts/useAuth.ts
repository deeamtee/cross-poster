import { useContext } from 'react';
import { AuthContext } from './AuthContext.context';
import type { AuthContextType } from './AuthContext.context';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};