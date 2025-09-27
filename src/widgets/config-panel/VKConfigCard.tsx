import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Card } from "@/ui/card";
import type { VKConfig, VKCommunityToken } from "@types";
import {
  Auth,
  Config,
  ConfigResponseMode,
  ConfigSource,
  OneTap,
  OneTapInternalEvents,
  WidgetEvents,
} from "@vkid/sdk";
import { saveVkTokenFromConfig } from "@modules/publishing/lib";
import { authService } from "@modules/auth";

interface VKConfigCardProps {
  enabled: boolean;
  config: VKConfig;
  onToggle: (enabled: boolean) => void;
  onConfigChange: (config: VKConfig) => void;
}

const VK_SCOPE = "wall,photos,groups,offline";
const COMMUNITY_SCOPE = "wall,photos,docs";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";
const COMMUNITY_REDIRECT_URI = import.meta.env.VITE_VK_COMMUNITY_REDIRECT_URI;

type CommunityTokenPayload = {
  groupId: number;
  accessToken: string;
  expiresIn?: number;
  scope?: string;
};

type CommunityAuthMessage = {
  type: "vk-community-auth";
  payload: {
    state: string;
    tokens?: CommunityTokenPayload[];
    error?: string;
  };
};

const isCommunityAuthMessage = (value: unknown): value is CommunityAuthMessage => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  if (candidate.type !== "vk-community-auth") {
    return false;
  }
  const payload = candidate.payload as Record<string, unknown> | undefined;
  return Boolean(payload && typeof payload.state === "string");
};

const computeExpiresAt = (expiresIn?: number): string | undefined => {
  if (!expiresIn || !Number.isFinite(expiresIn)) {
    return undefined;
  }
  return new Date(Date.now() + expiresIn * 1000).toISOString();
};

const mergeCommunities = (
  existing: VKCommunityToken[] = [],
  updates: VKCommunityToken[] = [],
): VKCommunityToken[] => {
  const map = new Map<number, VKCommunityToken>();

  existing.forEach((community) => {
    map.set(community.groupId, {
      ...community,
      permissions: community.permissions ? [...community.permissions] : undefined,
    });
  });

  updates.forEach((community) => {
    const current = map.get(community.groupId);
    if (current) {
      map.set(community.groupId, {
        ...current,
        ...community,
        name: community.name || current.name,
        screenName: community.screenName ?? current.screenName,
        photoUrl: community.photoUrl ?? current.photoUrl,
        accessToken: community.accessToken ?? current.accessToken,
        accessTokenExpiresAt: community.accessTokenExpiresAt ?? current.accessTokenExpiresAt,
        scope: community.scope ?? current.scope,
        permissions: community.permissions ?? current.permissions,
        obtainedAt: community.obtainedAt ?? current.obtainedAt,
        isSelected: typeof community.isSelected === "boolean" ? community.isSelected : current.isSelected,
      });
    } else {
      map.set(community.groupId, community);
    }
  });

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
};

const normalizeCommunityFromApi = (
  group: Record<string, unknown>,
  fallback?: VKCommunityToken,
): VKCommunityToken | null => {
  const rawId = typeof group.id === "number" ? group.id : Number(group.id);
  if (!Number.isFinite(rawId) || !rawId) {
    return null;
  }

  const groupId = Math.abs(Math.trunc(rawId));
  const ownerId = `-${groupId}`;
  const name = typeof group.name === "string" && group.name.length > 0
    ? group.name
    : fallback?.name ?? String(groupId);
  const screenName = typeof group.screen_name === "string" && group.screen_name.length > 0
    ? group.screen_name
    : fallback?.screenName;
  const photoUrl = typeof group.photo_200 === "string" && group.photo_200.length > 0
    ? group.photo_200
    : typeof group.photo_100 === "string" && group.photo_100.length > 0
    ? group.photo_100
    : fallback?.photoUrl;

  return {
    groupId,
    ownerId,
    name,
    screenName,
    photoUrl,
    accessToken: fallback?.accessToken,
    accessTokenExpiresAt: fallback?.accessTokenExpiresAt,
    scope: fallback?.scope,
    permissions: fallback?.permissions ? [...fallback.permissions] : undefined,
    obtainedAt: fallback?.obtainedAt,
    isSelected: fallback?.isSelected ?? false,
  };
};

const generateState = (): string => {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    if (crypto.getRandomValues) {
      const buffer = new Uint32Array(4);
      crypto.getRandomValues(buffer);
      return Array.from(buffer)
        .map((value) => value.toString(16))
        .join("-");
    }
  }
  return Math.random().toString(36).slice(2);
};

export const VKConfigCard: React.FC<VKConfigCardProps> = ({
  enabled,
  config,
  onToggle,
  onConfigChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const oneTapRef = useRef<OneTap | null>(null);
  const authWindowRef = useRef<Window | null>(null);
  const configRef = useRef<VKConfig>(config);

  const [isFetchingGroups, setIsFetchingGroups] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [pendingState, setPendingState] = useState<string | null>(null);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const updateConfig = useCallback(
    (transform: (current: VKConfig) => VKConfig) => {
      const nextConfig = transform(configRef.current);
      configRef.current = nextConfig;
      onConfigChange(nextConfig);
      saveVkTokenFromConfig(nextConfig);
    },
    [onConfigChange],
  );

  const communities = config.communities ?? [];
  const communitiesCount = communities.length;


  useEffect(() => {
    const containerElement = containerRef.current;

    const closeOneTap = () => {
      if (!oneTapRef.current) {
        return;
      }

      try {
        oneTapRef.current.close();
      } catch (error) {
        console.error("VK ID OneTap close error:", error);
      } finally {
        oneTapRef.current = null;
      }
    };

    if (!enabled) {
      closeOneTap();
      if (containerElement) {
        containerElement.innerHTML = "";
      }
      return () => {
        closeOneTap();
        if (containerElement) {
          containerElement.innerHTML = "";
        }
      };
    }

    const clientId = Number(import.meta.env.VITE_VK_CLIENT_ID);
    if (!clientId || Number.isNaN(clientId)) {
      console.error("VK ID: VITE_VK_CLIENT_ID is not set or invalid");
      return () => {
        closeOneTap();
        if (containerElement) {
          containerElement.innerHTML = "";
        }
      };
    }

    try {
      Config.init({
        app: clientId,
        redirectUrl: window.location.origin,
        responseMode: ConfigResponseMode.Callback,
        source: ConfigSource.LOWCODE,
        scope: VK_SCOPE,
      });

      const oneTap = new OneTap();
      oneTapRef.current = oneTap;

      if (containerElement) {
        containerElement.innerHTML = "";
        oneTap
          .render({
            container: containerElement,
            showAlternativeLogin: true,
          })
          .on(WidgetEvents.ERROR, (error: unknown) => {
            console.error("VK ID OneTap error:", error);
          })
          .on(OneTapInternalEvents.LOGIN_SUCCESS, async (payload: { code?: string; device_id?: string }) => {
            try {
              const { code, device_id } = payload || {};
              if (!code || !device_id) {
                console.error("VK ID payload missing code or device_id");
                return;
              }

              const tokens = await Auth.exchangeCode(code, device_id);

              const expiresAt = tokens.expires_in
                ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
                : undefined;

              updateConfig((current) => ({
                ...current,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token ?? current.refreshToken,
                accessTokenExpiresAt: expiresAt,
                userId: tokens.user_id ? String(tokens.user_id) : current.userId,
                scope: tokens.scope ?? VK_SCOPE,
                deviceId: device_id,
              }));

              setAuthMessage("VK ID user token updated");
              setAuthError(null);
            } catch (error: unknown) {
              console.error("VK ID exchange failed:", error);
              setAuthError("Failed to exchange VK ID authorization code");
            }
          });
      }
    } catch (error) {
      console.error("VK ID initialization failed:", error);
    }

    return () => {
      closeOneTap();
      if (containerElement) {
        containerElement.innerHTML = "";
      }
    };
  }, [enabled, updateConfig]);

  const fetchAdminGroups = useCallback(async () => {
    const currentConfig = configRef.current;
    if (!currentConfig.accessToken) {
      setGroupsError("Authorize via VK ID to load communities");
      return;
    }

    const authToken = authService.getAccessToken();
    if (!authToken) {
      setGroupsError("Authentication required to sync communities");
      return;
    }

    setIsFetchingGroups(true);
    setGroupsError(null);
    setAuthError(null);
    setAuthMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/vk/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          access_token: currentConfig.accessToken,
          filter: "admin",
          extended: 1,
          fields: "screen_name,photo_50,photo_100,photo_200",
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        const message =
          payload?.error?.message ??
          `Failed to load VK communities (status ${response.status})`;
        throw new Error(message);
      }

      const items: unknown[] = Array.isArray(payload?.data?.items)
        ? payload.data.items
        : [];
      const existingMap = new Map(
        (currentConfig.communities ?? []).map((community) => [community.groupId, community]),
      );

      const normalizedCommunities = items
        .map((item) => {
          const record = item as Record<string, unknown>;
          const rawId = record['id'];
          const numericId =
            typeof rawId === 'number'
              ? rawId
              : typeof rawId === 'string'
              ? Number(rawId)
              : undefined;
          const normalizedId =
            Number.isFinite(numericId) && numericId
              ? Math.abs(Math.trunc(Number(numericId)))
              : undefined;
          const fallback = normalizedId !== undefined ? existingMap.get(normalizedId) : undefined;
          return normalizeCommunityFromApi(record, fallback);
        })
        .filter((community): community is VKCommunityToken => Boolean(community));

      updateConfig((current) => ({
        ...current,
        communities: mergeCommunities(current.communities, normalizedCommunities),
        lastSyncedAt: new Date().toISOString(),
      }));

      setAuthMessage(
        normalizedCommunities.length > 0
          ? `Loaded ${normalizedCommunities.length} ${
              normalizedCommunities.length === 1 ? "community" : "communities"
            }`
          : "No communities found for the current account.",
      );
    } catch (error) {
      console.error("VK groups proxy failed", error);
      const message = error instanceof Error ? error.message : "Failed to load VK communities";
      setGroupsError(message);
      setAuthError(message);
    } finally {
      setIsFetchingGroups(false);
    }
  }, [updateConfig]);

  useEffect(() => {
    if (!enabled || !config.accessToken || communitiesCount > 0 || isFetchingGroups) {
      return;
    }
    fetchAdminGroups();
  }, [enabled, config.accessToken, communitiesCount, fetchAdminGroups, isFetchingGroups]);

  const handleAuthMessage = useCallback(
    (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      if (!isCommunityAuthMessage(event.data)) {
        return;
      }

      const { payload } = event.data;
      if (pendingState && payload.state !== pendingState) {
        return;
      }

      setPendingState(null);
      setIsAuthorizing(false);

      if (authWindowRef.current && !authWindowRef.current.closed) {
        authWindowRef.current.close();
      }
      authWindowRef.current = null;

      if (payload.error) {
        setAuthError(payload.error);
        return;
      }

      const tokens = Array.isArray(payload.tokens) ? payload.tokens : [];
      const updates: VKCommunityToken[] = tokens
        .map((token) => {
          if (!token || typeof token.groupId !== "number" || !token.accessToken) {
            return null;
          }
          const groupId = Math.abs(Math.trunc(token.groupId));
          const existing = configRef.current.communities?.find((community) => community.groupId === groupId);
          return {
            groupId,
            ownerId: `-${groupId}`,
            name: existing?.name ?? `Group ${groupId}`,
            screenName: existing?.screenName,
            photoUrl: existing?.photoUrl,
            accessToken: token.accessToken,
            accessTokenExpiresAt: computeExpiresAt(token.expiresIn) ?? existing?.accessTokenExpiresAt,
            scope: token.scope ?? existing?.scope,
            permissions: existing?.permissions ? [...existing.permissions] : undefined,
            obtainedAt: new Date().toISOString(),
            isSelected: true,
          } satisfies VKCommunityToken;
        })
        .filter((community): community is VKCommunityToken => Boolean(community));

      if (updates.length === 0) {
        setAuthError("Authorization completed without receiving tokens");
        return;
      }

      updateConfig((current) => ({
        ...current,
        communities: mergeCommunities(current.communities, updates),
      }));

      setAuthMessage(`Authorized ${updates.length} VK ${updates.length === 1 ? "community" : "communities"}`);
      setAuthError(null);
    },
    [pendingState, updateConfig],
  );

  useEffect(() => {
    window.addEventListener("message", handleAuthMessage);
    return () => window.removeEventListener("message", handleAuthMessage);
  }, [handleAuthMessage]);

  useEffect(() => {
    if (!isAuthorizing) {
      return;
    }

    const timer = window.setInterval(() => {
      if (authWindowRef.current && authWindowRef.current.closed) {
        window.clearInterval(timer);
        authWindowRef.current = null;
        setIsAuthorizing(false);
        setPendingState(null);
        setAuthError("Authorization window closed before completion");
      }
    }, 500);

    return () => window.clearInterval(timer);
  }, [isAuthorizing]);

  const handleCommunitySelection = (groupId: number, isSelected: boolean) => {
    updateConfig((current) => ({
      ...current,
      communities: current.communities.map((community) =>
        community.groupId === groupId ? { ...community, isSelected } : community,
      ),
    }));
  };

  const handleClearCommunityToken = (groupId: number) => {
    updateConfig((current) => ({
      ...current,
      communities: current.communities.map((community) =>
        community.groupId === groupId
          ? {
              ...community,
              accessToken: undefined,
              accessTokenExpiresAt: undefined,
              scope: undefined,
              obtainedAt: undefined,
            }
          : community,
      ),
    }));
  };

  const handleAuthorizeSelected = () => {
    const clientId = Number(import.meta.env.VITE_VK_CLIENT_ID);
    if (!clientId || Number.isNaN(clientId)) {
      setAuthError("VK client id is not configured");
      return;
    }

    const selectedCommunities = (configRef.current.communities ?? []).filter((community) => community.isSelected);
    if (selectedCommunities.length === 0) {
      setAuthError("Select at least one community to authorize");
      return;
    }

    const state = generateState();
    const redirectUri =
      typeof COMMUNITY_REDIRECT_URI === "string" && COMMUNITY_REDIRECT_URI.trim().length > 0
        ? COMMUNITY_REDIRECT_URI.trim()
        : `${window.location.origin}/vk-community-auth`;
    const params = new URLSearchParams({
      client_id: clientId.toString(),
      display: "popup",
      redirect_uri: redirectUri,
      response_type: "token",
      group_ids: selectedCommunities.map((community) => community.groupId).join(","),
      scope: COMMUNITY_SCOPE,
      state,
    });

    const authUrl = `https://oauth.vk.com/authorize?${params.toString()}`;
    const popup = window.open(authUrl, "vk-community-auth", "width=640,height=720");

    if (!popup) {
      setAuthError("Popup was blocked by the browser");
      return;
    }

    authWindowRef.current = popup;
    setPendingState(state);
    setIsAuthorizing(true);
    setAuthError(null);
    setAuthMessage(null);

    popup.focus();
  };

  const handleClearUserToken = () => {
    updateConfig((current) => ({
      ...current,
      accessToken: undefined,
      accessTokenExpiresAt: undefined,
      refreshToken: undefined,
      userId: undefined,
      deviceId: undefined,
      scope: undefined,
    }));
  };

  const selectedCount = communities.filter((community) => community.isSelected).length;
  const selectedWithoutToken = communities.filter((community) => community.isSelected && !community.accessToken);
  const canAuthorize = selectedCount > 0 && !isAuthorizing;

  const userTokenStatus = useMemo(() => {
    if (!config.accessToken) {
      return "User access token is not connected.";
    }

    if (!config.accessTokenExpiresAt) {
      return "User access token does not expire automatically.";
    }

    const expiresAt = new Date(config.accessTokenExpiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      return "User access token expiration date is invalid.";
    }

    return `User access token expires at ${expiresAt.toLocaleString()}`;
  }, [config.accessToken, config.accessTokenExpiresAt]);

  return (
    <Card
      header={
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.14.141-.259.259-.374.261l.213-3.053 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.136-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">VK</h3>
            <p className="text-sm text-gray-500">Authorize a VK ID account and select communities for publishing</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Enable VK integration</span>
          <label htmlFor="vk-enabled" className="relative inline-block w-12 h-6 cursor-pointer">
            <input
              type="checkbox"
              id="vk-enabled"
              checked={enabled}
              onChange={(e) => onToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {enabled && (
          <div className="space-y-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">VK ID user token</h4>
                {config.accessToken && (
                  <button
                    type="button"
                    onClick={handleClearUserToken}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Clear token
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-600">{userTokenStatus}</p>
              {config.userId && (
                <p className="text-xs text-gray-500">User ID: {config.userId}</p>
              )}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div id="vkid-one-tap-container" ref={containerRef} />
              </div>
              <p className="text-xs text-gray-500">
                Sign in with VK ID to refresh your user access token. User tokens are required to fetch communities where you have admin access.
              </p>
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-semibold text-gray-700">Communities</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={fetchAdminGroups}
                    disabled={isFetchingGroups || !config.accessToken}
                    className="px-3 py-2 text-sm rounded-md border border-blue-200 text-blue-600 hover:bg-blue-50 disabled:opacity-60"
                  >
                    {isFetchingGroups ? "Syncing..." : "Sync communities"}
                  </button>
                  <button
                    type="button"
                    onClick={handleAuthorizeSelected}
                    disabled={!canAuthorize}
                    className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {isAuthorizing ? "Waiting for confirmation..." : selectedWithoutToken.length > 0 ? "Authorize selected" : "Reauthorize selected"}
                  </button>
                </div>
              </div>

              {groupsError && <p className="text-xs text-red-600">{groupsError}</p>}
              {authError && <p className="text-xs text-red-600">{authError}</p>}
              {authMessage && <p className="text-xs text-green-600">{authMessage}</p>}

              {communities.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No communities loaded yet. Authorize via VK ID and click "Sync communities" to fetch groups where you are an admin.
                </p>
              ) : (
                <div className="space-y-3">
                  {communities.map((community) => (
                    <div
                      key={community.groupId}
                      className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-3"
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={community.isSelected}
                          onChange={(event) => handleCommunitySelection(community.groupId, event.target.checked)}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{community.name}</p>
                          <p className="text-xs text-gray-500">
                            ID: {community.ownerId}
                            {community.screenName ? ` · @${community.screenName}` : ""}
                          </p>
                          {community.accessToken ? (
                            <p className="text-xs text-green-600">
                              Token ready
                              {community.accessTokenExpiresAt
                                ? ` · expires ${new Date(community.accessTokenExpiresAt).toLocaleString()}`
                                : ""
                              }
                            </p>
                          ) : (
                            <p className="text-xs text-amber-600">Token missing — authorize this community</p>
                          )}
                        </div>
                      </label>
                      {community.accessToken && (
                        <button
                          type="button"
                          onClick={() => handleClearCommunityToken(community.groupId)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Remove token
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedWithoutToken.length > 0 && (
                <p className="text-xs text-amber-600">
                  {selectedWithoutToken.length} selected {selectedWithoutToken.length === 1 ? "community" : "communities"} do not have tokens yet.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </Card>
  );
};
