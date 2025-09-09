import { useState } from 'react';
import { useAuth } from '../contexts';
import type { AuthCredentials, AuthError } from '../types';

/**
 * Hook for handling sign in form state and submission
 */
export const useSignIn = () => {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const handleSignIn = async (credentials: AuthCredentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await signIn(credentials);
      if (result.error) {
        setError(result.error);
        return false;
      }
      return true;
    } catch (err) {
      setError({
        code: 'unknown',
        message: err instanceof Error ? err.message : 'An unknown error occurred'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    handleSignIn,
    loading,
    error,
    clearError: () => setError(null)
  };
};

/**
 * Hook for handling sign up form state and submission
 */
export const useSignUp = () => {
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const handleSignUp = async (credentials: AuthCredentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await signUp(credentials);
      if (result.error) {
        setError(result.error);
        return false;
      }
      return true;
    } catch (err) {
      setError({
        code: 'unknown',
        message: err instanceof Error ? err.message : 'An unknown error occurred'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    handleSignUp,
    loading,
    error,
    clearError: () => setError(null)
  };
};

/**
 * Hook for handling password reset
 */
export const usePasswordReset = () => {
  const { sendPasswordResetEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePasswordReset = async (email: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      await sendPasswordResetEmail(email);
      setSuccess(true);
      return true;
    } catch (err) {
      setError({
        code: 'unknown',
        message: err instanceof Error ? err.message : 'Failed to send reset email'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    handlePasswordReset,
    loading,
    error,
    success,
    clearError: () => setError(null),
    clearSuccess: () => setSuccess(false)
  };
};