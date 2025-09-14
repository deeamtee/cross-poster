import type { Platform, AppConfig } from '@core/types';

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