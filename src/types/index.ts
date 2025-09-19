// Post types
export interface PostDraft {
  content: string;
  images?: File[];
}

// Platform types
export type Platform = 'telegram' | 'vk';

export interface PlatformConfig {
  platform: Platform;
  enabled: boolean;
  config: TelegramConfig | VKConfig;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string; // Channel username or chat ID
}

export interface VKConfig {
  ownerId: string; // Wall identifier (negative for communities)
  accessToken?: string; // VK access token obtained via VK ID
  accessTokenExpiresAt?: string; // ISO string with token expiration time
  userId?: string; // VK user ID associated with the token
  refreshToken?: string; // Optional refresh token from VK ID
  scope?: string; // OAuth scope
  deviceId?: string; // Device identifier returned by VK ID (required for refresh)
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

// Health check response
export interface HealthCheckResponse {
  success: boolean;
  data: {
    status: string;
    timestamp: string;
    uptime: number;
  };
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
