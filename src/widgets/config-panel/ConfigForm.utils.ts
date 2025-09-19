import type { AppConfig, TelegramConfig, VKConfig, Platform, PlatformConfig } from "@types";

export const getPlatformConfig = (
  config: AppConfig,
  platform: Platform
): { enabled: boolean; config: TelegramConfig | VKConfig } => {
  const platformConfig = config.platforms.find((p: PlatformConfig) => p.platform === platform);

  if (platform === "telegram") {
    return {
      enabled: platformConfig?.enabled || false,
      config: (platformConfig?.config as TelegramConfig) || { botToken: "", chatId: "" },
    };
  }

  return {
    enabled: platformConfig?.enabled || false,
    config: (platformConfig?.config as VKConfig) || { ownerId: "" },
  };
};

export const updatePlatformConfigInAppConfig = (
  config: AppConfig,
  platform: Platform,
  enabled: boolean,
  platformConfig: TelegramConfig | VKConfig
): AppConfig => {
  const newPlatforms = [...config.platforms];
  const existingPlatformIndex = newPlatforms.findIndex((p: PlatformConfig) => p.platform === platform);

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
