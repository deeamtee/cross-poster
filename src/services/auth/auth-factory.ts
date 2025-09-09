import type { AuthService } from './interfaces';
import { FirebaseAuthService } from './firebase-auth';

/**
 * Authentication service factory
 * This makes it easy to switch between different auth providers
 */
export class AuthServiceFactory {
  private static instance: AuthService | null = null;

  /**
   * Get the current authentication service instance
   * Currently uses Firebase, but can be easily switched
   */
  static getInstance(): AuthService {
    if (!this.instance) {
      // Currently using Firebase, but this can be easily changed
      this.instance = new FirebaseAuthService();
    }
    return this.instance;
  }

  /**
   * Set a custom authentication service
   * Useful for testing or switching to a different provider
   */
  static setInstance(service: AuthService): void {
    this.instance = service;
  }

  /**
   * Reset the instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}

// Export the default instance for convenience
export const authService = AuthServiceFactory.getInstance();