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
  accessToken: string;
  groupId?: string; // For posting to groups/pages
  userId?: string;  // For posting to user wall
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

// Application state
export interface AppConfig {
  platforms: PlatformConfig[];
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