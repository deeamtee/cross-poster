// Post types
export interface PostDraft {
  content: string;
  images?: File[];
}

// Platform types
export type Platform = 'telegram';

export interface PlatformConfig {
  platform: Platform;
  enabled: boolean;
  config: TelegramConfig;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string; // Channel username or chat ID
}

// Application state
export interface AppConfig {
  platforms: PlatformConfig[];
}

// API Response types
export interface PostResult {
  platform: Platform;
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface PublishResponse {
  results: PostResult[];
  totalSuccess: number;
  totalFailure: number;
}

// Encryption types
export interface EncryptedData {
  encryptedData: string;
  iv: string;
  salt: string;
}

// Authentication types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface AuthResult {
  user: User | null;
  error: AuthError | null;
}