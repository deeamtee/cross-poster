import type { AppConfig, Platform, PlatformConfig, TelegramConfig, VKConfig } from "@types";

/**
 * Get configured platforms from app config
 */
export function getConfiguredPlatforms(config: AppConfig): Platform[] {
  return config.platforms
    .filter((platform: PlatformConfig) => {
      if (!platform.enabled) {
        return false;
      }

      if (platform.platform === "vk") {
        const vkConfig = platform.config as VKConfig;
        return Boolean(vkConfig.accessToken && vkConfig.ownerId);
      }

      return true;
    })
    .map((platform: PlatformConfig) => platform.platform);
}

/**
 * Find specific platform configuration
 */
export function getPlatformConfig(config: AppConfig, platform: Platform): PlatformConfig | undefined {
  return config.platforms.find((p: PlatformConfig) => p.platform === platform);
}

/**
 * Count enabled platforms
 */
export function getEnabledPlatformsCount(config: AppConfig): number {
  return config.platforms.filter((platform: PlatformConfig) => platform.enabled).length;
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
      if (!vkConfig.ownerId) {
        errors.push("Owner ID is required for VK");
      }
      if (!vkConfig.accessToken) {
        errors.push("VK access token is required. Authorize via VK ID.");
      }
      break;
    }
  }

  return errors;
}
