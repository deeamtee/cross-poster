import { encryptionApi, type EncryptedData } from '@/utils/encryption';
import { authService } from '@modules/auth';
import { mergeVkConfigWithStoredToken, saveVkTokenFromConfig, clearStoredVkToken } from '@modules/publishing/lib';
import type { AppConfig, VKConfig, PlatformConfig, TelegramConfig } from '@types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

interface ConfigExistsResponse {
  exists: boolean;
}

interface ApiResponsePayload {
  success?: boolean;
  data?: unknown;
  error?: {
    code?: number | string;
    message?: string;
  };
}

const handleVkTokenPersistence = (config: AppConfig): void => {
  const vkPlatform = config.platforms.find((platform: PlatformConfig) => platform.platform === 'vk');
  if (vkPlatform) {
    saveVkTokenFromConfig(vkPlatform.config as VKConfig);
  } else {
    clearStoredVkToken();
  }
};

const sanitizePlatforms = (platforms: PlatformConfig[]): PlatformConfig[] => {
  return platforms
    .filter((platformConfig) =>
      (platformConfig.platform === 'telegram' || platformConfig.platform === 'vk') &&
      platformConfig.config &&
      typeof platformConfig.config === 'object'
    )
    .map((platformConfig) => {
      if (platformConfig.platform === 'vk') {
        const rawConfig = platformConfig.config as Partial<VKConfig> & { groupId?: string };
        const normalizedConfig: VKConfig = {
          ownerId: typeof rawConfig.ownerId === 'string' && rawConfig.ownerId.length > 0
            ? rawConfig.ownerId
            : rawConfig.groupId
            ? String(rawConfig.groupId)
            : '',
          accessToken: rawConfig.accessToken,
          accessTokenExpiresAt: rawConfig.accessTokenExpiresAt,
          userId: rawConfig.userId,
          refreshToken: rawConfig.refreshToken,
          scope: rawConfig.scope,
          deviceId: rawConfig.deviceId,
        };

        const mergedConfig = mergeVkConfigWithStoredToken(normalizedConfig);
        saveVkTokenFromConfig(mergedConfig);

        return {
          ...platformConfig,
          config: mergedConfig,
        };
      }

      return platformConfig;
    });
};

const withPlatformDefaults = (config: AppConfig): AppConfig => {
  const existingPlatforms = new Map(config.platforms.map((platformConfig) => [platformConfig.platform, platformConfig]));

  const existingTelegram = existingPlatforms.get('telegram');
  const telegramConfig = existingTelegram?.config as TelegramConfig | undefined;
  const telegramDefaults: PlatformConfig = existingTelegram
    ? {
        ...existingTelegram,
        config: {
          botToken: telegramConfig?.botToken ?? '',
          chatId: telegramConfig?.chatId ?? '',
        },
      }
    : {
        platform: 'telegram',
        enabled: false,
        config: {
          botToken: '',
          chatId: '',
        },
      };

  const existingVk = existingPlatforms.get('vk');
  const vkConfig = existingVk?.config as VKConfig | undefined;
  const vkDefaults: PlatformConfig = existingVk
    ? {
        ...existingVk,
        config: {
          ownerId: vkConfig?.ownerId ?? '',
          accessToken: vkConfig?.accessToken,
          accessTokenExpiresAt: vkConfig?.accessTokenExpiresAt,
          userId: vkConfig?.userId,
          refreshToken: vkConfig?.refreshToken,
          scope: vkConfig?.scope,
          deviceId: vkConfig?.deviceId,
        },
      }
    : {
        platform: 'vk',
        enabled: false,
        config: {
          ownerId: '',
          accessToken: undefined,
          accessTokenExpiresAt: undefined,
          userId: undefined,
          refreshToken: undefined,
          scope: undefined,
          deviceId: undefined,
        },
      };

  return {
    platforms: [telegramDefaults, vkDefaults],
  };
};

const authorizedFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const token = authService.getAccessToken();
  if (!token) {
    throw new Error('User not authenticated');
  }

  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Authorization', `Bearer ${token}`);

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });
};

const parseJson = async (response: Response): Promise<ApiResponsePayload> => {
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    const parsed = await response.json();
    return typeof parsed === 'object' && parsed !== null ? (parsed as ApiResponsePayload) : {};
  }

  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    const parsed = JSON.parse(text) as unknown;
    return typeof parsed === 'object' && parsed !== null ? (parsed as ApiResponsePayload) : {};
  } catch {
    throw new Error(text || 'Unexpected response from server');
  }
};

export const configApi = {
  async saveConfig(config: AppConfig): Promise<void> {
    const user = await authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!encryptionApi.isSupported()) {
      throw new Error('Encryption not supported in this environment');
    }

    const normalizedConfig = withPlatformDefaults(config);

    handleVkTokenPersistence(normalizedConfig);

    try {
      const configJson = JSON.stringify(normalizedConfig);
      const encryptedConfig = await encryptionApi.encrypt(configJson, user.uid);

      const response = await authorizedFetch('/config', {
        method: 'POST',
        body: JSON.stringify({
          encryptedData: encryptedConfig.encryptedData,
          iv: encryptedConfig.iv,
          salt: encryptedConfig.salt,
          version: '1.0',
        }),
      });

      if (!response.ok) {
        const payload = await parseJson(response);
        throw new Error(payload.error?.message ?? 'Failed to save configuration to secure storage');
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to save configuration to secure storage');
    }
  },

  async loadConfig(): Promise<AppConfig | null> {
    const user = await authService.getCurrentUser();
    if (!user) {
      console.warn('User not authenticated, cannot load configuration');
      return null;
    }

    if (!encryptionApi.isSupported()) {
      throw new Error('Encryption not supported in this environment');
    }

    try {
      const response = await authorizedFetch('/config');

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const payload = await parseJson(response);
        throw new Error(payload.error?.message ?? 'Failed to load configuration');
      }

      const payload = await parseJson(response);
      if (!payload.success || !payload.data) {
        return null;
      }

      const encryptedData: EncryptedData = {
        encryptedData: (payload.data as Record<string, string>).encryptedData,
        iv: (payload.data as Record<string, string>).iv,
        salt: (payload.data as Record<string, string>).salt,
      };

      const decryptedConfigJson = await encryptionApi.decrypt(encryptedData, user.uid);
      const config: AppConfig = JSON.parse(decryptedConfigJson);

      const sanitizedPlatforms = sanitizePlatforms(config.platforms ?? []);

      return withPlatformDefaults({ platforms: sanitizedPlatforms });
    } catch (error) {
      console.error('Failed to load configuration:', error);
      return null;
    }
  },

  async deleteConfig(): Promise<void> {
    const user = await authService.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await authorizedFetch('/config', { method: 'DELETE' });
      if (!response.ok) {
        const payload = await parseJson(response);
        throw new Error(payload.error?.message ?? 'Failed to delete configuration');
      }
      clearStoredVkToken();
    } catch (error) {
      console.error('Failed to delete configuration:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to delete configuration from secure storage');
    }
  },

  async hasConfig(): Promise<boolean> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return false;
    }

    try {
      const response = await authorizedFetch('/config/exists');
      if (!response.ok) {
        return false;
      }

      const payload = await parseJson(response);
      if (!payload.success) {
        return false;
      }

      const data = payload.data as ConfigExistsResponse | undefined;
      return Boolean(data?.exists);
    } catch (error) {
      console.error('Failed to check configuration existence:', error);
      return false;
    }
  },

  async migrateFromLocalStorage(): Promise<boolean> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return false;
    }

    try {
      if (await this.hasConfig()) {
        return false;
      }

      const legacyConfigKey = `cross-poster-config-${user.uid}`;
      const savedConfig = localStorage.getItem(legacyConfigKey);

      if (!savedConfig) {
        return false;
      }

      const config: AppConfig = JSON.parse(savedConfig);
      const upgradedPlatforms = sanitizePlatforms(config.platforms ?? []);

      const upgradedConfig: AppConfig = withPlatformDefaults({ platforms: upgradedPlatforms });
      handleVkTokenPersistence(upgradedConfig);

      await this.saveConfig(upgradedConfig);

      localStorage.removeItem(legacyConfigKey);

      return true;
    } catch (error) {
      console.error('Failed to migrate configuration from localStorage:', error);
      return false;
    }
  },
};
