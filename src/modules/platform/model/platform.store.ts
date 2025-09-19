import type { Platform, AppConfig } from '@types';

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
