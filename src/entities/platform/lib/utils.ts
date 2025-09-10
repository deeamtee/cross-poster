import type { Platform, PlatformConfig, AppConfig } from '../model';

/**
 * Get configured platforms that are enabled
 */
export function getConfiguredPlatforms(config: AppConfig): Platform[] {
  return config.platforms
    .filter(platform => platform.enabled)
    .map(platform => platform.platform);
}

/**
 * Check if platform is configured and enabled
 */
export function isPlatformEnabled(config: AppConfig, platform: Platform): boolean {
  const platformConfig = config.platforms.find(p => p.platform === platform);
  return Boolean(platformConfig?.enabled);
}

/**
 * Get platform configuration
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
    vk: 'VKontakte',
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
      
    case 'vk':
      const vkConfig = platformConfig.config as any;
      if (!vkConfig.accessToken) {
        errors.push('Access Token is required for VK');
      }
      if (!vkConfig.groupId && !vkConfig.userId) {
        errors.push('Group ID or User ID is required for VK');
      }
      break;
  }
  
  return errors;
}