import { useEffect, useMemo } from "react";

interface CommunityTokenPayload {
  groupId: number;
  accessToken: string;
  expiresIn?: number;
  scope?: string;
}

interface ParsedFragment {
  state: string;
  tokens: CommunityTokenPayload[];
  error?: string;
}

const parseFragment = (hash: string): ParsedFragment => {
  const clean = hash.startsWith("#") ? hash.slice(1) : hash;
  const pairs = clean.split("&").filter(Boolean);

  const tokenMap = new Map<number, CommunityTokenPayload>();
  const general: Record<string, string> = {};
  let state = "";
  let error: string | undefined;

  pairs.forEach((pair) => {
    const [rawKey, rawValue] = pair.split("=");
    const key = decodeURIComponent(rawKey ?? "");
    const value = decodeURIComponent(rawValue ?? "");

    if (!key) {
      return;
    }

    if (key === "state") {
      state = value;
      return;
    }

    if (key === "error" || key === "error_description") {
      error = value;
      return;
    }

    if (key.startsWith("access_token_")) {
      const groupId = Number(key.replace("access_token_", ""));
      if (Number.isFinite(groupId)) {
        const normalizedId = Math.abs(Math.trunc(groupId));
        const entry = tokenMap.get(normalizedId) ?? { groupId: normalizedId, accessToken: "" };
        entry.accessToken = value;
        tokenMap.set(normalizedId, entry);
      }
      return;
    }

    if (key.startsWith("expires_in_")) {
      const groupId = Number(key.replace("expires_in_", ""));
      if (Number.isFinite(groupId)) {
        const normalizedId = Math.abs(Math.trunc(groupId));
        const entry = tokenMap.get(normalizedId) ?? { groupId: normalizedId, accessToken: "" };
        entry.expiresIn = Number(value);
        tokenMap.set(normalizedId, entry);
      }
      return;
    }

    if (key.startsWith("scope_")) {
      const groupId = Number(key.replace("scope_", ""));
      if (Number.isFinite(groupId)) {
        const normalizedId = Math.abs(Math.trunc(groupId));
        const entry = tokenMap.get(normalizedId) ?? { groupId: normalizedId, accessToken: "" };
        entry.scope = value;
        tokenMap.set(normalizedId, entry);
      }
      return;
    }

    if (key === "access_token" || key === "expires_in" || key === "group_id" || key === "scope") {
      general[key] = value;
      return;
    }

    general[key] = value;
  });

  let tokens: CommunityTokenPayload[] = [];

  if (tokenMap.size > 0) {
    tokens = Array.from(tokenMap.values()).filter((entry) => entry.accessToken.length > 0);
  } else if (general.access_token && general.group_id) {
    const groupId = Number(general.group_id);
    if (Number.isFinite(groupId) && groupId !== 0) {
      tokens = [
        {
          groupId: Math.abs(Math.trunc(groupId)),
          accessToken: general.access_token,
          expiresIn: general.expires_in ? Number(general.expires_in) : undefined,
          scope: general.scope,
        },
      ];
    }
  }

  return {
    state,
    tokens,
    error,
  };
};

export const VkCommunityAuthPage: React.FC = () => {
  const parsed = useMemo(() => parseFragment(window.location.hash), []);

  useEffect(() => {
    if (window.opener && typeof window.opener.postMessage === "function") {
      window.opener.postMessage(
        {
          type: "vk-community-auth",
          payload: parsed,
        },
        window.location.origin,
      );
    }
  }, [parsed]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.close();
      } catch (error) {
        console.error("Failed to close window", error);
      }
    }, 2500);

    return () => window.clearTimeout(timer);
  }, []);

  const headline = parsed.error ? "Authorization failed" : "Authorization completed";
  const subtitle = parsed.error
    ? parsed.error
    : parsed.tokens.length > 0
    ? "Tokens received successfully. You can return to the main window."
    : "No tokens received. You can close this window.";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-lg font-semibold text-gray-900">{headline}</h1>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>
    </div>
  );
};

export default VkCommunityAuthPage;