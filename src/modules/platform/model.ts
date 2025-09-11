import type { Platform, AppConfig } from '../../core/types';
import { initialPlatformState } from './store';

export function getConfiguredPlatforms(config: AppConfig): Platform[] {
  return config.platforms
    .filter(platformConfig => platformConfig.enabled)
    .map(platformConfig => platformConfig.platform);
}

export const platformModel = {
  getConfiguredPlatforms,
  initialState: initialPlatformState
};