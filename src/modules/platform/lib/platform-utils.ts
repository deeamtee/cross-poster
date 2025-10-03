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
        return Array.isArray(vkConfig.communities)
          ? vkConfig.communities.some(
              (community) =>
                community.isSelected && typeof community.accessToken === "string" && community.accessToken.length > 0,
            )
          : false;
      }

      if (platform.platform === "telegram") {
        const tgConfig = platform.config as TelegramConfig;
        const channels = Array.isArray(tgConfig.channels) ? tgConfig.channels : [];
        return channels.some((channel) => channel.isSelected && channel.chatId.trim().length > 0);
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
      const channels = Array.isArray(tgConfig.channels) ? tgConfig.channels : [];
      const selectedChannels = channels.filter((channel) => channel.isSelected);
      if (selectedChannels.length === 0) {
        errors.push("Select at least one Telegram channel");
      } else if (selectedChannels.some((channel) => channel.chatId.trim().length === 0)) {
        errors.push("Selected Telegram channels must have a Chat ID");
      }
      break;
    }
    case "vk": {
      const vkConfig = platformConfig.config as VKConfig;
      const communities = Array.isArray(vkConfig.communities) ? vkConfig.communities : [];
      const selectedCommunities = communities.filter((community) => community.isSelected);

      if (selectedCommunities.length === 0) {
        errors.push("Select at least one VK community");
      } else if (selectedCommunities.some((community) => !community.accessToken)) {
        errors.push("Authorize selected VK communities to obtain access tokens");
      }
      break;
    }
  }

  return errors;
}
