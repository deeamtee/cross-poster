import type { AppConfig, TelegramConfig, VKConfig, Platform, PlatformConfig } from "@types";

const createDefaultTelegramConfig = (): TelegramConfig => ({
  botToken: "",
  chatId: "",
});

const createDefaultVkConfig = (): VKConfig => ({
  accessToken: undefined,
  accessTokenExpiresAt: undefined,
  userId: undefined,
  refreshToken: undefined,
  scope: undefined,
  deviceId: undefined,
  communities: [],
  lastSyncedAt: undefined,
});

export const getPlatformConfig = (
  config: AppConfig,
  platform: Platform
): { enabled: boolean; config: TelegramConfig | VKConfig } => {
  const platformConfig = config.platforms.find((p: PlatformConfig) => p.platform === platform);

  if (platform === "telegram") {
    return {
      enabled: platformConfig?.enabled || false,
      config: (platformConfig?.config as TelegramConfig) || createDefaultTelegramConfig(),
    };
  }

  return {
    enabled: platformConfig?.enabled || false,
    config: (platformConfig?.config as VKConfig) || createDefaultVkConfig(),
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
