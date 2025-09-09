import React from 'react';
import { providers } from './providers';

type ComponentWithProps<P = {}> = React.ComponentType<P>;

export function withProviders<P extends {}>(
  Component: ComponentWithProps<P>
): ComponentWithProps<P> {
  return function WrappedComponent(props: P) {
    return (
      <providers.QueryProvider>
        <providers.AuthProvider>
          <Component {...props} />
        </providers.AuthProvider>
      </providers.QueryProvider>
    );
  };
}