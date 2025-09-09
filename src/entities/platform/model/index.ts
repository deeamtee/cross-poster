import type { Platform, PlatformConfig, AppConfig } from '../../../shared/types';

export interface PlatformStore {
  config: AppConfig;
  configuredPlatforms: Platform[];
  loading: boolean;
}

export const initialPlatformState: PlatformStore = {
  config: { platforms: [] },
  configuredPlatforms: [],
  loading: false,
};

export function getConfiguredPlatforms(config: AppConfig): Platform[] {
  return config.platforms
    .filter(platformConfig => platformConfig.enabled)
    .map(platformConfig => platformConfig.platform);
}

export const platformModel = {
  getConfiguredPlatforms,
  initialState: initialPlatformState
};

export type { Platform, PlatformConfig, AppConfig };