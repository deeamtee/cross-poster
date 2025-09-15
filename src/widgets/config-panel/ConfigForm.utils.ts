import type { AppConfig, TelegramConfig, VKConfig, Platform } from "@core/types";


export const getPlatformConfig = (
  config: AppConfig,
  platform: Platform
): { enabled: boolean; config: TelegramConfig | VKConfig } => {
  const platformConfig = config.platforms.find((p) => p.platform === platform);

  if (platform === "telegram") {
    return {
      enabled: platformConfig?.enabled || false,
      config: (platformConfig?.config as TelegramConfig) || { botToken: "", chatId: "" },
    };
  } else if (platform === "vk") {
    return {
      enabled: platformConfig?.enabled || false,
      config: (platformConfig?.config as VKConfig) || { groupToken: "", groupId: "" },
    };
  } else {
    // For VK ID, use the same config structure as VK but with empty values
    return {
      enabled: platformConfig?.enabled || false,
      config: (platformConfig?.config as VKConfig) || { groupToken: "", groupId: "" },
    };
  }
};

export const updatePlatformConfigInAppConfig = (
  config: AppConfig,
  platform: Platform,
  enabled: boolean,
  platformConfig: TelegramConfig | VKConfig
): AppConfig => {
  const newPlatforms = [...config.platforms];
  const existingPlatformIndex = newPlatforms.findIndex((p) => p.platform === platform);

  if (existingPlatformIndex >= 0) {
    newPlatforms[existingPlatformIndex] = {
      ...newPlatforms[existingPlatformIndex],
      enabled,
      config: platformConfig,
    };
  } else {
    newPlatforms.push({
      platform,
      enabled,
      config: platformConfig,
    });
  }

  return { ...config, platforms: newPlatforms };
};