import type { VKCommunityToken } from "@types";

export type CommunityTokenPayload = {
  groupId: number;
  accessToken: string;
  expiresIn?: number;
  scope?: string;
};

export type CommunityAuthMessage = {
  type: "vk-community-auth";
  payload: {
    state: string;
    tokens?: CommunityTokenPayload[];
    error?: string;
  };
};

export const computeExpiresAt = (expiresIn?: number): string | undefined =>
  typeof expiresIn === "number" ? new Date(Date.now() + expiresIn * 1000).toISOString() : undefined;

export const generateState = (): string => {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    if (crypto.getRandomValues) {
      const buffer = new Uint32Array(4);
      crypto.getRandomValues(buffer);
      return Array.from(buffer, (value) => value.toString(16)).join("-");
    }
  }
  return Math.random().toString(36).slice(2);
};

export const isCommunityAuthMessage = (value: unknown): value is CommunityAuthMessage => {
  const candidate = value as CommunityAuthMessage | null;
  return Boolean(candidate && candidate.type === "vk-community-auth" && candidate.payload?.state);
};

export const mergeCommunities = (
  existing: VKCommunityToken[] = [],
  updates: VKCommunityToken[] = [],
): VKCommunityToken[] => {
  const map = new Map<number, VKCommunityToken>();

  existing.forEach((community) => {
    map.set(community.groupId, { ...community });
  });

  updates.forEach((community) => {
    const current = map.get(community.groupId);
    map.set(community.groupId, current ? { ...current, ...community } : community);
  });

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
};

export const normalizeCommunityFromApi = (
  group: Record<string, unknown>,
  fallback?: VKCommunityToken,
): VKCommunityToken => {
  const groupId = Math.abs(Number(group.id));

  return {
    groupId,
    ownerId: `-${groupId}`,
    name: String(group.name ?? fallback?.name ?? groupId),
    screenName: (group as Record<string, string>).screen_name ?? fallback?.screenName,
    photoUrl: (group as Record<string, string>).photo_200 ?? (group as Record<string, string>).photo_100 ?? fallback?.photoUrl,
    accessToken: fallback?.accessToken,
    accessTokenExpiresAt: fallback?.accessTokenExpiresAt,
    scope: fallback?.scope,
    permissions: fallback?.permissions,
    obtainedAt: fallback?.obtainedAt,
    isSelected: fallback?.isSelected ?? false,
  };
};

export const buildCommunityAuthUrl = ({
  clientId,
  groupIds,
  state,
  scope,
  redirectUri,
}: {
  clientId: number;
  groupIds: number[];
  state: string;
  scope: string;
  redirectUri: string;
}): string => {
  const params = new URLSearchParams({
    client_id: String(clientId),
    display: "popup",
    redirect_uri: redirectUri,
    response_type: "token",
    group_ids: groupIds.join(","),
    scope,
    state,
  });

  return `https://oauth.vk.com/authorize?${params.toString()}`;
};
