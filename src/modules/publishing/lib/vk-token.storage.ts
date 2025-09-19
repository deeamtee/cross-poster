import { Auth } from '@vkid/sdk';
import type { VKConfig } from '@types';

const STORAGE_KEY = 'cross-poster:vk-token';
const EXPIRATION_BUFFER_MS = 60_000;

type StoredVkToken = {
  ownerId?: string;
  accessToken?: string;
  accessTokenExpiresAt?: string;
  refreshToken?: string;
  deviceId?: string;
  userId?: string;
  scope?: string;
  updatedAt?: string;
};

const isBrowser = typeof window !== 'undefined';

const readFromStorage = (): StoredVkToken | null => {
  if (!isBrowser) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredVkToken;
  } catch (error) {
    console.error('Failed to read VK token from storage', error);
    return null;
  }
};

const writeToStorage = (data: StoredVkToken | null) => {
  if (!isBrowser) {
    return;
  }

  try {
    if (!data || !data.accessToken) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const payload: StoredVkToken = {
      ...readFromStorage(),
      ...data,
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to persist VK token to storage', error);
  }
};

export const getStoredVkToken = (): StoredVkToken | null => readFromStorage();

export const saveVkTokenFromConfig = (config: VKConfig) => {
  if (!config.accessToken) {
    writeToStorage(null);
    return;
  }

  writeToStorage({
    ownerId: config.ownerId,
    accessToken: config.accessToken,
    accessTokenExpiresAt: config.accessTokenExpiresAt,
    refreshToken: config.refreshToken,
    deviceId: config.deviceId,
    userId: config.userId,
    scope: config.scope,
  });
};

export const clearStoredVkToken = () => {
  writeToStorage(null);
};

export const mergeVkConfigWithStoredToken = (config: VKConfig): VKConfig => {
  const stored = readFromStorage();
  if (!stored) {
    return config;
  }

  return {
    ...config,
    ownerId: config.ownerId || stored.ownerId || '',
    accessToken: stored.accessToken ?? config.accessToken,
    accessTokenExpiresAt: stored.accessTokenExpiresAt ?? config.accessTokenExpiresAt,
    refreshToken: stored.refreshToken ?? config.refreshToken,
    deviceId: stored.deviceId ?? config.deviceId,
    userId: stored.userId ?? config.userId,
    scope: stored.scope ?? config.scope,
  };
};

export const isVkTokenExpired = (config: VKConfig, bufferMs: number = EXPIRATION_BUFFER_MS): boolean => {
  if (!config.accessToken) {
    return true;
  }

  if (!config.accessTokenExpiresAt) {
    return false;
  }

  const expiresAt = new Date(config.accessTokenExpiresAt).getTime();
  if (!Number.isFinite(expiresAt)) {
    return false;
  }

  return Date.now() >= expiresAt - bufferMs;
};

export const refreshVkToken = async (config: VKConfig): Promise<VKConfig | null> => {
  const stored = readFromStorage();
  const refreshToken = config.refreshToken ?? stored?.refreshToken;
  const deviceId = config.deviceId ?? stored?.deviceId;

  if (!refreshToken || !deviceId) {
    return null;
  }

  try {
    const tokens = await Auth.refreshToken(refreshToken, deviceId);
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : undefined;

    const updated: VKConfig = {
      ...config,
      accessToken: tokens.access_token,
      accessTokenExpiresAt: expiresAt,
      refreshToken: tokens.refresh_token ?? config.refreshToken,
      userId: tokens.user_id ? String(tokens.user_id) : config.userId,
      scope: tokens.scope ?? config.scope,
      deviceId,
    };

    saveVkTokenFromConfig(updated);
    return updated;
  } catch (error) {
    console.error('VK token refresh failed', error);
    clearStoredVkToken();
    return null;
  }
};
