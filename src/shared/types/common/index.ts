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

// Application state
export interface AppConfig {
  platforms: PlatformConfig[];
}