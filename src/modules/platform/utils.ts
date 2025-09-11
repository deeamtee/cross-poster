import type { AppConfig, Platform, PlatformConfig } from '../../core/types';

/**
 * Get configured platforms from app config
 */
export function getConfiguredPlatforms(config: AppConfig): Platform[] {
  return config.platforms
    .filter(platform => platform.enabled)
    .map(platform => platform.platform);
}

/**
 * Find specific platform configuration
 */
export function getPlatformConfig(config: AppConfig, platform: Platform): PlatformConfig | undefined {
  return config.platforms.find(p => p.platform === platform);
}

/**
 * Count enabled platforms
 */
export function getEnabledPlatformsCount(config: AppConfig): number {
  return config.platforms.filter(platform => platform.enabled).length;
}

/**
 * Get platform display name
 */
export function getPlatformDisplayName(platform: Platform): string {
  const displayNames: Record<Platform, string> = {
    telegram: 'Telegram',
  };
  return displayNames[platform];
}

/**
 * Validate platform configuration
 */
export function validatePlatformConfig(platformConfig: PlatformConfig): string[] {
  const errors: string[] = [];
  
  switch (platformConfig.platform) {
    case 'telegram':
      const tgConfig = platformConfig.config as any;
      if (!tgConfig.botToken) {
        errors.push('Bot Token is required for Telegram');
      }
      if (!tgConfig.chatId) {
        errors.push('Chat ID is required for Telegram');
      }
      break;
  }
  
  return errors;
}