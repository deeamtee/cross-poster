import type { Platform } from '../common';

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