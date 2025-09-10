import type { Platform, AppConfig } from '../../../shared/types';

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