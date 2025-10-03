import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/ui/card";
import type { VKConfig, VKCommunityToken } from "@types";
import { Auth, Config, ConfigResponseMode, ConfigSource, OneTap, OneTapInternalEvents, WidgetEvents } from "@vkid/sdk";
import { saveVkTokenFromConfig } from "@modules/publishing/lib";
import { authService } from "@modules/auth";
import {
  buildCommunityAuthUrl,
  computeExpiresAt,
  generateState,
  isCommunityAuthMessage,
  mergeCommunities,
  normalizeCommunityFromApi,
  type CommunityTokenPayload,
} from "./vkConfig.helpers";

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

type StatusVariant = "error" | "success" | "info";

type StatusMessage = {
  variant: StatusVariant;
  text: string;
};

export const VKConfigCard: React.FC<VKConfigCardProps> = ({ enabled, config, onToggle, onConfigChange }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const oneTapRef = useRef<OneTap | null>(null);
  const authWindowRef = useRef<Window | null>(null);
  const configRef = useRef<VKConfig>(config);

  const { accessToken, communities = [], accessTokenExpiresAt } = config;

  const [status, setStatus] = useState<StatusMessage | null>(null);
  const [isFetchingGroups, setIsFetchingGroups] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [pendingState, setPendingState] = useState<string | null>(null);

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
    [onConfigChange]
  );

  useEffect(() => {
    const containerElement = containerRef.current;

    const clearContainer = () => {
      if (containerElement) {
        containerElement.innerHTML = "";
      }
    };

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

    const destroyWidget = () => {
      closeOneTap();
      clearContainer();
    };

    if (!enabled || accessToken) {
      destroyWidget();
      return destroyWidget;
    }

    const clientId = Number(import.meta.env.VITE_VK_CLIENT_ID);
    if (!clientId || Number.isNaN(clientId)) {
      console.error("VK ID: VITE_VK_CLIENT_ID is not set or invalid");
      return destroyWidget;
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
        clearContainer();
        oneTap
          .render({
            container: containerElement,
            showAlternativeLogin: true,
          })
          .on(WidgetEvents.ERROR, (error: unknown) => {
            console.error("VK ID OneTap error:", error);
          })
          .on(OneTapInternalEvents.LOGIN_SUCCESS, async ({ code, device_id }: { code: string; device_id: string }) => {
            if (!code || !device_id) {
              console.error("VK ID payload missing code or device_id");
              return;
            }

            try {
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

              setStatus({ variant: "success", text: "VK ID user token updated." });
            } catch (error) {
              console.error("VK ID exchange failed:", error);
              setStatus({ variant: "error", text: "Failed to exchange VK ID authorization code." });
            }
          });
      }
    } catch (error) {
      console.error("VK ID initialization failed:", error);
    }

    return destroyWidget;
  }, [enabled, accessToken, updateConfig]);

  const fetchAdminGroups = useCallback(async () => {
    const currentConfig = configRef.current;
    if (!currentConfig.accessToken) {
      setStatus({ variant: "error", text: "Authorize via VK ID to load communities." });
      return;
    }

    const authToken = authService.getAccessToken();
    if (!authToken) {
      setStatus({ variant: "error", text: "Authentication required to sync communities." });
      return;
    }

    setIsFetchingGroups(true);
    setStatus(null);

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
        throw new Error(payload?.error?.message ?? `Failed to load VK communities (status ${response.status})`);
      }

      const items: Record<string, unknown>[] = payload.data?.items ?? [];
      const existingMap = new Map(
        (currentConfig.communities ?? []).map((community: VKCommunityToken) => [community.groupId, community])
      );

      const normalized = items.map((item) => {
        const groupId = Math.abs(Number(item.id));
        return normalizeCommunityFromApi(item, existingMap.get(groupId));
      });

      updateConfig((current) => ({
        ...current,
        communities: mergeCommunities(current.communities, normalized),
        lastSyncedAt: new Date().toISOString(),
      }));

      setStatus({
        variant: "success",
        text:
          normalized.length > 0
            ? `Loaded ${normalized.length} ${normalized.length === 1 ? "community" : "communities"}.`
            : "No communities found for the current account.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load VK communities.";
      setStatus({ variant: "error", text: message });
    } finally {
      setIsFetchingGroups(false);
    }
  }, [updateConfig]);

  useEffect(() => {
    if (!enabled || !accessToken || communities.length > 0 || isFetchingGroups) {
      return;
    }
    fetchAdminGroups();
  }, [enabled, accessToken, communities.length, fetchAdminGroups, isFetchingGroups]);

  const handleAuthMessage = useCallback(
    (event: MessageEvent) => {
      if (event.origin !== window.location.origin || !isCommunityAuthMessage(event.data)) {
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
        setStatus({ variant: "error", text: payload.error });
        return;
      }

      const tokens = (payload.tokens ?? []) as CommunityTokenPayload[];
      if (tokens.length === 0) {
        setStatus({ variant: "error", text: "Authorization completed without receiving tokens." });
        return;
      }

      const existingMap = new Map(
        (configRef.current.communities ?? []).map((community: VKCommunityToken) => [community.groupId, community])
      );

      const updates: VKCommunityToken[] = tokens.map((token) => {
        const groupId = Math.abs(token.groupId);
        const existing = existingMap.get(groupId);

        return {
          groupId,
          ownerId: `-${groupId}`,
          name: existing?.name ?? `Group ${groupId}`,
          screenName: existing?.screenName,
          photoUrl: existing?.photoUrl,
          accessToken: token.accessToken,
          accessTokenExpiresAt: computeExpiresAt(token.expiresIn) ?? existing?.accessTokenExpiresAt,
          scope: token.scope ?? existing?.scope,
          permissions: existing?.permissions,
          obtainedAt: new Date().toISOString(),
          isSelected: true,
        };
      });

      updateConfig((current) => ({
        ...current,
        communities: mergeCommunities(current.communities, updates),
      }));

      setStatus({
        variant: "success",
        text: `Authorized ${updates.length} VK ${updates.length === 1 ? "community" : "communities"}.`,
      });
    },
    [pendingState, updateConfig]
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
        setStatus({ variant: "error", text: "Authorization window closed before completion." });
      }
    }, 500);

    return () => window.clearInterval(timer);
  }, [isAuthorizing]);

  const handleCommunitySelection = useCallback(
    (groupId: number, isSelected: boolean) => {
      updateConfig((current) => ({
        ...current,
        communities: current.communities.map((community) =>
          community.groupId === groupId ? { ...community, isSelected } : community
        ),
      }));
    },
    [updateConfig]
  );

  const handleClearCommunityToken = useCallback(
    (groupId: number) => {
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
            : community
        ),
      }));
      setStatus({ variant: "info", text: "Community token removed." });
    },
    [updateConfig]
  );

  const handleAuthorizeSelected = useCallback(() => {
    const clientId = Number(import.meta.env.VITE_VK_CLIENT_ID);
    if (!clientId || Number.isNaN(clientId)) {
      setStatus({ variant: "error", text: "VK client id is not configured." });
      return;
    }

    const selectedCommunities = (configRef.current.communities ?? []).filter((community) => community.isSelected);
    if (selectedCommunities.length === 0) {
      setStatus({ variant: "error", text: "Select at least one community to authorize." });
      return;
    }

    const state = generateState();
    const redirectUri =
      typeof COMMUNITY_REDIRECT_URI === "string" && COMMUNITY_REDIRECT_URI.trim().length > 0
        ? COMMUNITY_REDIRECT_URI.trim()
        : `${window.location.origin}/vk-community-auth`;

    const authUrl = buildCommunityAuthUrl({
      clientId,
      groupIds: selectedCommunities.map((community) => community.groupId),
      state,
      scope: COMMUNITY_SCOPE,
      redirectUri,
    });

    const popup = window.open(authUrl, "vk-community-auth", "width=640,height=720");
    if (!popup) {
      setStatus({ variant: "error", text: "Popup was blocked by the browser." });
      return;
    }

    authWindowRef.current = popup;
    setPendingState(state);
    setIsAuthorizing(true);
    setStatus({ variant: "info", text: "Complete authorization in the opened window." });
    popup.focus();
  }, []);

  const handleClearUserToken = useCallback(() => {
    updateConfig((current) => ({
      ...current,
      accessToken: undefined,
      accessTokenExpiresAt: undefined,
      refreshToken: undefined,
      userId: undefined,
      deviceId: undefined,
      scope: undefined,
    }));
    setStatus({ variant: "info", text: "VK ID user token cleared." });
  }, [updateConfig]);

  const selectedCount = communities.filter((community) => community.isSelected).length;
  const selectedWithoutToken = communities.filter((community) => community.isSelected && !community.accessToken);
  const canAuthorize = selectedCount > 0 && !isAuthorizing;

  const userTokenStatus = useMemo(() => {
    if (!accessToken) {
      return "User access token is not connected.";
    }

    if (!accessTokenExpiresAt) {
      return "User access token does not expire automatically.";
    }

    const expiresAt = new Date(accessTokenExpiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      return "User access token expiration date is invalid.";
    }

    return `User access token expires at ${expiresAt.toLocaleString()}`;
  }, [accessToken, accessTokenExpiresAt]);

  const statusClassName =
    status?.variant === "error"
      ? "text-xs text-red-600"
      : status?.variant === "success"
      ? "text-xs text-green-600"
      : "text-xs text-gray-600";

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
              onChange={({ target }) => onToggle(target.checked)}
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
                {accessToken && (
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
              {config.userId && <p className="text-xs text-gray-500">User ID: {config.userId}</p>}
              {!accessToken ? (
                <>
                  <div ref={containerRef} className="min-h-[120px]" />
                  <p className="text-xs text-gray-500">
                    Use VK ID OneTap to connect your account. Tokens are stored securely in your browser.
                  </p>
                </>
              ) : (
                <p className="text-xs text-gray-600">
                  VK ID authorization is active. You can now sync and authorize communities.
                </p>
              )}
            </section>

            {accessToken && (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-gray-700">Communities</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={fetchAdminGroups}
                      disabled={isFetchingGroups || !accessToken}
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
                      {isAuthorizing
                        ? "Waiting for confirmation..."
                        : selectedWithoutToken.length > 0
                        ? "Authorize selected"
                        : "Reauthorize selected"}
                    </button>
                  </div>
                </div>

                {status && <p className={statusClassName}>{status.text}</p>}

                {communities.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No communities loaded yet. Authorize via VK ID and click "Sync communities" to fetch groups where
                    you are an admin.
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
                            className="mt-1 flex-shrink-0"
                            checked={community.isSelected}
                            onChange={(event) => handleCommunitySelection(community.groupId, event.target.checked)}
                          />
                          <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center mt-0.5 flex-shrink-0">
                            {community.photoUrl ? (
                              <img
                                src={community.photoUrl}
                                alt={`${community.name ?? "Community"} avatar`}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-sm font-semibold text-gray-600">
                                {(community.name ?? "").trim().charAt(0).toUpperCase() || "?"}
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{community.name}</p>
                            <p className="text-xs text-gray-500">
                              ID: {community.ownerId}
                              {community.screenName ? ` - @${community.screenName}` : ""}
                            </p>
                            {community.accessToken ? (
                              <>
                                <p className="text-xs text-green-600">
                                  Token ready
                                  {community.accessTokenExpiresAt
                                    ? ` - expires ${new Date(community.accessTokenExpiresAt).toLocaleString()}`
                                    : ""}
                                </p>
                                <p className="text-xs text-gray-500 break-all">Token: {community.accessToken}</p>
                              </>
                            ) : (
                              <>
                                <p className="text-xs text-amber-600">Token missing</p>
                                <p className="text-xs text-gray-500">Token: none</p>
                              </>
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
                    {selectedWithoutToken.length} selected{" "}
                    {selectedWithoutToken.length === 1 ? "community" : "communities"} do not have tokens yet.
                  </p>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
