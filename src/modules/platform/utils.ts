import type { AppConfig, Platform, PlatformConfig, TelegramConfig, VKConfig } from "@core/types";

/**
 * Get configured platforms from app config
 */
export function getConfiguredPlatforms(config: AppConfig): Platform[] {
  return config.platforms.filter((platform) => platform.enabled).map((platform) => platform.platform);
}

/**
 * Find specific platform configuration
 */
export function getPlatformConfig(config: AppConfig, platform: Platform): PlatformConfig | undefined {
  return config.platforms.find((p) => p.platform === platform);
}

/**
 * Count enabled platforms
 */
export function getEnabledPlatformsCount(config: AppConfig): number {
  return config.platforms.filter((platform) => platform.enabled).length;
}

/**
 * Get platform display name
 */
export function getPlatformDisplayName(platform: Platform): string {
  const displayNames: Record<Platform, string> = {
    telegram: "Telegram",
    vk: "VK",
  };
  return displayNames[platform];
}

/**
 * Validate platform configuration
 */
export function validatePlatformConfig(platformConfig: PlatformConfig): string[] {
  const errors: string[] = [];

  switch (platformConfig.platform) {
    case "telegram": {
      const tgConfig = platformConfig.config as TelegramConfig;
      if (!tgConfig.botToken) {
        errors.push("Bot Token is required for Telegram");
      }
      if (!tgConfig.chatId) {
        errors.push("Chat ID is required for Telegram");
      }
      break;
    }
    case "vk": {
      const vkConfig = platformConfig.config as VKConfig;
      if (!vkConfig.groupId) {
        errors.push("Group ID is required for VK");
      }
      if (!vkConfig.groupToken) {
        errors.push("Group Token is required for VK");
      }

      break;
    }
  }

  return errors;
}
