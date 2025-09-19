import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@modules/auth';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
}

export const providers = {
  QueryProvider: ({ children }: ProvidersProps) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  ),

  AuthProvider: ({ children }: ProvidersProps) => (
    <AuthProvider>
      {children}
    </AuthProvider>
  ),
};
