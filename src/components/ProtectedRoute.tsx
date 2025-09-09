import React, { type ReactNode } from 'react';
import { useAuth } from '../contexts';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Protected route component that requires authentication
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};