import { Auth } from '@vkid/sdk';
import type { VKConfig, VKCommunityToken } from '@types';

const STORAGE_KEY = 'cross-poster:vk-token';
const EXPIRATION_BUFFER_MS = 60_000;

type StoredVkToken = {
  accessToken?: string;
  accessTokenExpiresAt?: string;
  refreshToken?: string;
  deviceId?: string;
  userId?: string;
  scope?: string;
  communities?: VKCommunityToken[];
  lastSyncedAt?: string;
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

const hasPersistableData = (data: StoredVkToken | null): boolean => {
  if (!data) {
    return false;
  }
  const hasUserToken = Boolean(data.accessToken);
  const hasCommunityTokens = Array.isArray(data.communities) && data.communities.length > 0;
  return hasUserToken || hasCommunityTokens;
};

const writeToStorage = (data: StoredVkToken | null) => {
  if (!isBrowser) {
    return;
  }

  try {
    if (!hasPersistableData(data)) {
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

const normalizeCommunity = (community: Partial<VKCommunityToken> & { groupId: number }): VKCommunityToken => ({
  groupId: community.groupId,
  ownerId: community.ownerId ?? `-${community.groupId}`,
  name: community.name ?? String(community.groupId),
  screenName: community.screenName,
  photoUrl: community.photoUrl,
  accessToken: community.accessToken,
  accessTokenExpiresAt: community.accessTokenExpiresAt,
  scope: community.scope,
  permissions: community.permissions,
  obtainedAt: community.obtainedAt,
  isSelected: community.isSelected ?? false,
});

const mergeCommunities = (
  configCommunities?: VKCommunityToken[],
  storedCommunities?: VKCommunityToken[],
): VKCommunityToken[] => {
  const map = new Map<number, VKCommunityToken>();

  (storedCommunities ?? []).forEach((community) => {
    map.set(community.groupId, normalizeCommunity(community));
  });

  (configCommunities ?? []).forEach((community) => {
    const normalized = normalizeCommunity(community);
    const existing = map.get(normalized.groupId);

    if (existing) {
      map.set(normalized.groupId, {
        ...existing,
        ...normalized,
        ownerId: normalized.ownerId || existing.ownerId,
        name: normalized.name || existing.name,
        accessToken: normalized.accessToken ?? existing.accessToken,
        accessTokenExpiresAt: normalized.accessTokenExpiresAt ?? existing.accessTokenExpiresAt,
        scope: normalized.scope ?? existing.scope,
        permissions: normalized.permissions ?? existing.permissions,
        obtainedAt: normalized.obtainedAt ?? existing.obtainedAt,
        isSelected: typeof normalized.isSelected === 'boolean' ? normalized.isSelected : existing.isSelected,
      });
    } else {
      map.set(normalized.groupId, normalized);
    }
  });

  return Array.from(map.values()).sort((a, b) => a.groupId - b.groupId);
};

export const getStoredVkToken = (): StoredVkToken | null => readFromStorage();

export const saveVkTokenFromConfig = (config: VKConfig) => {
  const storedData: StoredVkToken = {
    accessToken: config.accessToken,
    accessTokenExpiresAt: config.accessTokenExpiresAt,
    refreshToken: config.refreshToken,
    deviceId: config.deviceId,
    userId: config.userId,
    scope: config.scope,
    communities: config.communities ?? [],
    lastSyncedAt: config.lastSyncedAt,
  };

  writeToStorage(storedData);
};

export const clearStoredVkToken = () => {
  writeToStorage(null);
};

export const mergeVkConfigWithStoredToken = (config: VKConfig): VKConfig => {
  const stored = readFromStorage();
  if (!stored) {
    return {
      ...config,
      communities: mergeCommunities(config.communities, []),
    };
  }

  return {
    ...config,
    accessToken: stored.accessToken ?? config.accessToken,
    accessTokenExpiresAt: stored.accessTokenExpiresAt ?? config.accessTokenExpiresAt,
    refreshToken: stored.refreshToken ?? config.refreshToken,
    deviceId: stored.deviceId ?? config.deviceId,
    userId: stored.userId ?? config.userId,
    scope: stored.scope ?? config.scope,
    communities: mergeCommunities(config.communities, stored.communities),
    lastSyncedAt: stored.lastSyncedAt ?? config.lastSyncedAt,
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
      communities: mergeCommunities(config.communities, stored?.communities),
      lastSyncedAt: stored?.lastSyncedAt ?? config.lastSyncedAt,
    };

    saveVkTokenFromConfig(updated);
    return updated;
  } catch (error) {
    console.error('VK token refresh failed', error);
    clearStoredVkToken();
    return null;
  }
};
