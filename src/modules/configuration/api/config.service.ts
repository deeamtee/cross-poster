import { encryptionApi, type EncryptedData } from '@/utils/encryption';
import { authService } from '@modules/auth';
import { mergeVkConfigWithStoredToken, saveVkTokenFromConfig, clearStoredVkToken } from '@modules/publishing/lib';
import type { AppConfig, VKConfig, VKCommunityToken, PlatformConfig, TelegramConfig, TelegramChannel } from '@types';

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

const cloneCommunity = (community: VKCommunityToken): VKCommunityToken => ({
  ...community,
  permissions: community.permissions ? [...community.permissions] : undefined,
});

const cloneTelegramChannel = (channel: TelegramChannel): TelegramChannel => ({
  chatId: channel.chatId,
  isSelected: channel.isSelected,
  label: channel.label,
});

const createEmptyVkConfig = (): VKConfig => ({
  accessToken: undefined,
  accessTokenExpiresAt: undefined,
  userId: undefined,
  refreshToken: undefined,
  scope: undefined,
  deviceId: undefined,
  communities: [],
  lastSyncedAt: undefined,
});

const createEmptyTelegramConfig = (): TelegramConfig => ({
  botToken: '',
  channels: [
    {
      chatId: '',
      isSelected: true,
    },
  ],
});

const normalizeTelegramChannel = (value: unknown): TelegramChannel | null => {
  if (typeof value === 'string') {
    const chatId = value.trim();
    if (!chatId) {
      return null;
    }
    return {
      chatId,
      isSelected: true,
    };
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const source = value as Record<string, unknown>;
  const chatIdSource = source.chatId ?? source.id ?? source.channelId ?? source.channel_id;

  let chatId: string | undefined;
  if (typeof chatIdSource === 'string') {
    chatId = chatIdSource.trim();
  } else if (typeof chatIdSource === 'number') {
    chatId = chatIdSource.toString();
  }

  if (typeof chatId !== 'string' || chatId.length === 0) {
    return null;
  }

  const labelSource = source.label ?? source.name ?? source.title;
  const label = typeof labelSource === 'string' && labelSource.trim().length > 0 ? labelSource.trim() : undefined;

  const isSelectedSource = source.isSelected ?? source.selected ?? source.enabled;
  const isSelected = typeof isSelectedSource === 'boolean' ? isSelectedSource : true;

  return {
    chatId,
    isSelected,
    label,
  };
};

const normalizeTelegramConfig = (
  rawConfig: Partial<TelegramConfig> & { chatId?: unknown; channels?: unknown },
): TelegramConfig => {
  const channelsSource = Array.isArray(rawConfig.channels)
    ? rawConfig.channels
    : typeof rawConfig.chatId !== 'undefined'
    ? [rawConfig.chatId]
    : [];

  const channels = channelsSource
    .map((channel) => normalizeTelegramChannel(channel))
    .filter((channel): channel is TelegramChannel => Boolean(channel));

  if (channels.length === 0) {
    if (typeof rawConfig.chatId === 'string' && rawConfig.chatId.trim().length > 0) {
      channels.push({ chatId: rawConfig.chatId.trim(), isSelected: true });
    } else {
      channels.push({ ...createEmptyTelegramConfig().channels[0] });
    }
  }

  return {
    botToken: typeof rawConfig.botToken === 'string' ? rawConfig.botToken : '',
    channels: channels.map(cloneTelegramChannel),
  };
};

const normalizeCommunity = (value: unknown): VKCommunityToken | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const source = value as Record<string, unknown>;

  const groupIdSource =
    typeof source.groupId === 'number'
      ? source.groupId
      : typeof source.groupId === 'string'
      ? Number(source.groupId)
      : typeof source.id === 'number'
      ? source.id
      : typeof source.id === 'string'
      ? Number(source.id)
      : undefined;

  if (!Number.isFinite(groupIdSource) || !groupIdSource) {
    return null;
  }

  const groupId = Math.abs(Math.trunc(Number(groupIdSource)));

  const ownerIdSource = source.ownerId ?? source.owner_id;
  let ownerId: string | undefined;
  if (typeof ownerIdSource === 'string') {
    ownerId = ownerIdSource.trim();
  } else if (typeof ownerIdSource === 'number') {
    ownerId = ownerIdSource.toString();
  }
  const normalizedOwnerId =
    ownerId && ownerId.length > 0 ? (ownerId.startsWith('-') ? ownerId : `-${groupId}`) : `-${groupId}`;

  const nameSource = source.name;
  const screenNameSource = source.screenName ?? source.screen_name;
  const photoSource = source.photoUrl ?? source.photo_url ?? source.photo_200 ?? source.photo_100 ?? source.photo_50;

  const permissionsSource = source.permissions;
  const permissions = Array.isArray(permissionsSource)
    ? permissionsSource.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : undefined;

  const accessTokenSource = source.accessToken ?? source.access_token;
  const accessToken =
    typeof accessTokenSource === 'string' && accessTokenSource.length > 0 ? accessTokenSource : undefined;

  const expiresAtSource = source.accessTokenExpiresAt ?? source.access_token_expires_at;
  const accessTokenExpiresAt =
    typeof expiresAtSource === 'string' && expiresAtSource.length > 0 ? expiresAtSource : undefined;

  const scopeSource = source.scope;
  const scope = typeof scopeSource === 'string' && scopeSource.length > 0 ? scopeSource : undefined;

  const obtainedAtSource = source.obtainedAt ?? source.obtained_at;
  const obtainedAt =
    typeof obtainedAtSource === 'string' && obtainedAtSource.length > 0 ? obtainedAtSource : undefined;

  const isSelectedSource = source.isSelected ?? source.selected;
  const isSelected =
    typeof isSelectedSource === 'boolean' ? isSelectedSource : Boolean(accessToken);

  return {
    groupId,
    ownerId: normalizedOwnerId,
    name: typeof nameSource === 'string' && nameSource.length > 0 ? nameSource : String(groupId),
    screenName: typeof screenNameSource === 'string' && screenNameSource.length > 0 ? screenNameSource : undefined,
    photoUrl: typeof photoSource === 'string' && photoSource.length > 0 ? photoSource : undefined,
    accessToken,
    accessTokenExpiresAt,
    scope,
    permissions,
    obtainedAt,
    isSelected,
  };
};

const normalizeVkConfig = (
  rawConfig: Partial<VKConfig> & { communities?: unknown; ownerId?: unknown; groupId?: unknown },
): VKConfig => {
  const communities = Array.isArray(rawConfig.communities)
    ? rawConfig.communities
        .map((community) => normalizeCommunity(community))
        .filter((community): community is VKCommunityToken => Boolean(community))
    : [];

  if (
    communities.length === 0 &&
    typeof rawConfig.ownerId === 'string' &&
    rawConfig.ownerId.trim().length > 0
  ) {
    const ownerIdValue = rawConfig.ownerId.trim();
    const ownerIdNumber = Number(ownerIdValue);
    if (Number.isFinite(ownerIdNumber) && ownerIdNumber !== 0) {
      const groupId = Math.abs(Math.trunc(ownerIdNumber));
      communities.push({
        groupId,
        ownerId: ownerIdValue.startsWith('-') ? ownerIdValue : `-${groupId}`,
        name: ownerIdValue,
        screenName: undefined,
        photoUrl: undefined,
        accessToken: undefined,
        accessTokenExpiresAt: undefined,
        scope: undefined,
        permissions: undefined,
        obtainedAt: undefined,
        isSelected: true,
      });
    }
  }

  return {
    accessToken: typeof rawConfig.accessToken === 'string' ? rawConfig.accessToken : undefined,
    accessTokenExpiresAt:
      typeof rawConfig.accessTokenExpiresAt === 'string' ? rawConfig.accessTokenExpiresAt : undefined,
    userId: typeof rawConfig.userId === 'string' ? rawConfig.userId : undefined,
    refreshToken: typeof rawConfig.refreshToken === 'string' ? rawConfig.refreshToken : undefined,
    scope: typeof rawConfig.scope === 'string' ? rawConfig.scope : undefined,
    deviceId: typeof rawConfig.deviceId === 'string' ? rawConfig.deviceId : undefined,
    communities,
    lastSyncedAt: typeof rawConfig.lastSyncedAt === 'string' ? rawConfig.lastSyncedAt : undefined,
  };
};

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
        const normalizedConfig = normalizeVkConfig(platformConfig.config as Partial<VKConfig>);
        const mergedConfig = mergeVkConfigWithStoredToken({
          ...createEmptyVkConfig(),
          ...normalizedConfig,
        });

        saveVkTokenFromConfig(mergedConfig);

        return {
          ...platformConfig,
          config: mergedConfig,
        };
      }

      if (platformConfig.platform === 'telegram') {
        const telegramConfig = normalizeTelegramConfig(platformConfig.config as Partial<TelegramConfig>);
        return {
          ...platformConfig,
          config: {
            ...telegramConfig,
            channels: telegramConfig.channels.map(cloneTelegramChannel),
          },
        };
      }

      return platformConfig;
    });
};

const withPlatformDefaults = (config: AppConfig): AppConfig => {
  const existingPlatforms = new Map(config.platforms.map((platformConfig) => [platformConfig.platform, platformConfig]));

  const existingTelegram = existingPlatforms.get('telegram');
  const telegramConfig = existingTelegram
    ? normalizeTelegramConfig(existingTelegram.config as TelegramConfig)
    : undefined;
  const telegramDefaults: PlatformConfig = existingTelegram
    ? {
        ...existingTelegram,
          config: {
            botToken: telegramConfig?.botToken ?? '',
          channels: telegramConfig
              ? telegramConfig.channels.map(cloneTelegramChannel)
              : createEmptyTelegramConfig().channels.map(cloneTelegramChannel),
          },
        }
    : {
        platform: 'telegram',
        enabled: false,
        config: {
          ...createEmptyTelegramConfig(),
        },
      };

  const existingVk = existingPlatforms.get('vk');
  const sanitizedVk = mergeVkConfigWithStoredToken(
    existingVk
      ? {
          ...createEmptyVkConfig(),
          ...normalizeVkConfig(existingVk.config as VKConfig),
        }
      : createEmptyVkConfig(),
  );

  const vkDefaults: PlatformConfig = existingVk
    ? {
        ...existingVk,
        config: {
          ...sanitizedVk,
          communities: sanitizedVk.communities.map(cloneCommunity),
        },
      }
    : {
        platform: 'vk',
        enabled: false,
        config: createEmptyVkConfig(),
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
