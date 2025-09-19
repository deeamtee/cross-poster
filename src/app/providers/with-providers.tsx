import React from 'react';
import { providers } from './providers';

type ComponentWithProps<P extends object = Record<string, unknown>> = React.ComponentType<P>;

export function withProviders<P extends object>(
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
