import type { AuthCredentials, AuthError, AuthResult, User } from '@types';

export interface AuthService {
  signUp(credentials: AuthCredentials): Promise<AuthResult>;
  signIn(credentials: AuthCredentials): Promise<AuthResult>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
  sendPasswordResetEmail(email: string): Promise<void>;
  updateProfile(user: User, profile: { displayName?: string; photoURL?: string }): Promise<User>;
  initialize(): Promise<void>;
  getAccessToken(): string | null;
}

interface BackendAuthResponse {
  user: User;
  tokens: {
    token: string;
    expiresIn: number;
  };
}

interface BackendErrorDetails {
  code?: number | string;
  message?: string;
}


type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: BackendErrorDetails;
};

class BackendAuthService implements AuthService {
  private readonly apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';
  private readonly storageKey = 'cp_auth_token';
  private currentUser: User | null = null;
  private accessToken: string | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private listeners = new Set<(user: User | null) => void>();

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (!this.initializationPromise) {
      this.initializationPromise = this.bootstrap().finally(() => {
        this.initialized = true;
      });
    }

    await this.initializationPromise;
  }

  private async bootstrap(): Promise<void> {
    const storedToken = this.readStoredToken();
    if (!storedToken) {
      return;
    }

    this.accessToken = storedToken;
    try {
      const response = await this.fetchJson<{ user: User }>('/auth/me', { method: 'GET' }, true);
      this.currentUser = this.normalizeUser(response.user);
      this.notifyListeners();
    } catch (error) {
      console.warn('Failed to restore session', error);
      this.clearSession();
    }
  }

  private normalizeUser(user: User): User {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
    };
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private readStoredToken(): string | null {
    try {
      return localStorage.getItem(this.storageKey);
    } catch (error) {
      console.warn('Unable to read auth token from storage', error);
      return null;
    }
  }

  private storeToken(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem(this.storageKey, token);
      } else {
        localStorage.removeItem(this.storageKey);
      }
    } catch (error) {
      console.warn('Unable to persist auth token', error);
    }
  }

  private setSession(user: User, token: string): void {
    this.currentUser = this.normalizeUser(user);
    this.accessToken = token;
    this.storeToken(token);
    this.notifyListeners();
  }

  private clearSession(): void {
    this.currentUser = null;
    this.accessToken = null;
    this.storeToken(null);
    this.notifyListeners();
  }

  private notifyListeners(): void {
    for (const callback of this.listeners) {
      callback(this.currentUser);
    }
  }

  private buildHeaders(init?: HeadersInit, includeAuth = true): Headers {
    const headers = new Headers(init);

    if (includeAuth && this.accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    return headers;
  }

  private async fetchJson<T>(path: string, init?: RequestInit, includeAuth = false): Promise<T> {
    const url = `${this.apiBaseUrl}${path}`;
    const isFormData = init?.body instanceof FormData;

    const headers = this.buildHeaders(init?.headers, includeAuth);
    if (!isFormData && init?.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...init,
      headers,
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const payload = await this.parseResponse<T>(response);

    if (!payload.success) {
      const backendError = payload.error;
      const message = backendError?.message ?? `Request failed with status ${response.status}`;
      const code = backendError?.code ?? response.status;
      throw this.createError(typeof code === 'number' ? String(code) : code, message);
    }

    return payload.data as T;
  }

  private async parseResponse<T>(response: Response): Promise<ApiEnvelope<T>> {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const parsed = await response.json();
      return this.normalizePayload<T>(parsed);
    }

    const text = await response.text();
    if (!text) {
      return { success: false };
    }

    try {
      const parsed = JSON.parse(text);
      return this.normalizePayload<T>(parsed);
    } catch {
      throw new Error(text || 'UNKNOWN_RESPONSE');
    }
  }

  private normalizePayload<T>(value: unknown): ApiEnvelope<T> {
    if (!value || typeof value !== 'object') {
      return { success: false };
    }

    const record = value as Record<string, unknown>;
    const success = typeof record.success === 'boolean' ? record.success : false;
    const data = record.data as T | undefined;
    const error = record.error as BackendErrorDetails | undefined;

    return { success, data, error };
  }

  private createError(code: string, message: string): AuthError {
    return {
      code,
      message,
    };
  }

  private mapUnknownError(error: unknown, fallbackCode: string): AuthError {
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      const typed = error as { code?: string; message?: string };
      return this.createError(typed.code ?? fallbackCode, typed.message ?? 'Unknown error');
    }

    if (error instanceof Error) {
      const [codePart, ...messageParts] = error.message.split(':');
      if (messageParts.length > 0) {
        return this.createError(codePart || fallbackCode, messageParts.join(':') || 'Unknown error');
      }
      return this.createError(fallbackCode, error.message);
    }

    return this.createError(fallbackCode, 'Unknown error');
  }

  private buildAuthResult(user: User | null, error: AuthError | null): AuthResult {
    return {
      user,
      error,
    };
  }

  async signUp(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      const data = await this.fetchJson<BackendAuthResponse>(
        '/auth/sign-up',
        {
          method: 'POST',
          body: JSON.stringify(credentials),
        }
      );

      this.setSession(data.user, data.tokens.token);
      return this.buildAuthResult(this.currentUser, null);
    } catch (error) {
      return this.buildAuthResult(null, this.mapUnknownError(error, 'SIGN_UP_FAILED'));
    }
  }

  async signIn(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      const data = await this.fetchJson<BackendAuthResponse>(
        '/auth/sign-in',
        {
          method: 'POST',
          body: JSON.stringify(credentials),
        }
      );

      this.setSession(data.user, data.tokens.token);
      return this.buildAuthResult(this.currentUser, null);
    } catch (error) {
      return this.buildAuthResult(null, this.mapUnknownError(error, 'SIGN_IN_FAILED'));
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.fetchJson<void>(
        '/auth/sign-out',
        {
          method: 'POST',
        },
        true
      );
    } catch (error) {
      console.warn('Sign out request failed', error);
    } finally {
      this.clearSession();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    await this.initialize();
    return this.currentUser;
  }

  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentUser);
    void this.initialize();

    return () => {
      this.listeners.delete(callback);
    };
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    await this.fetchJson<void>(
      '/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      }
    );
  }

  async updateProfile(user: User, profile: { displayName?: string; photoURL?: string }): Promise<User> {
    try {
      const data = await this.fetchJson<BackendAuthResponse>(
        '/auth/profile',
        {
          method: 'PATCH',
          body: JSON.stringify(profile),
        },
        true
      );

      this.setSession(data.user, data.tokens.token);
      return this.currentUser ?? user;
    } catch (error) {
      const authError = this.mapUnknownError(error, 'UPDATE_PROFILE_FAILED');
      const err = new Error(authError.message);
      (err as Error & { code?: string }).code = authError.code;
      throw err;
    }
  }
}

class AuthServiceFactory {
  private static instance: AuthService | null = null;

  static getInstance(): AuthService {
    if (!this.instance) {
      this.instance = new BackendAuthService();
    }
    return this.instance;
  }

  static setInstance(service: AuthService): void {
    this.instance = service;
  }

  static reset(): void {
    this.instance = null;
  }
}

export const authService = AuthServiceFactory.getInstance();
