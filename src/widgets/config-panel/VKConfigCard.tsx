import React, { useEffect, useMemo, useRef } from "react";
import { Card } from "@/ui/card";
import type { VKConfig } from "@types";
import {
  Auth,
  Config,
  ConfigResponseMode,
  ConfigSource,
  OneTap,
  OneTapInternalEvents,
  WidgetEvents,
} from "@vkid/sdk";
import { saveVkTokenFromConfig, clearStoredVkToken } from "@modules/publishing/lib";

interface VKConfigCardProps {
  enabled: boolean;
  config: VKConfig;
  onToggle: (enabled: boolean) => void;
  onConfigChange: (config: VKConfig) => void;
}

const VK_SCOPE = "wall,photos,groups,offline";

export const VKConfigCard: React.FC<VKConfigCardProps> = ({
  enabled,
  config,
  onToggle,
  onConfigChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const oneTapRef = useRef<OneTap | null>(null);

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
      return;
    }

    const clientId = Number(import.meta.env.VITE_VK_CLIENT_ID);
    if (!clientId || Number.isNaN(clientId)) {
      console.error("VK ID: VITE_VK_CLIENT_ID is not set or invalid");
      return;
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

              const updatedConfig: VKConfig = {
                ...config,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token ?? config.refreshToken,
                accessTokenExpiresAt: expiresAt,
                userId: tokens.user_id ? String(tokens.user_id) : config.userId,
                scope: tokens.scope ?? VK_SCOPE,
                ownerId: config.ownerId || (tokens.user_id ? String(tokens.user_id) : ""),
                deviceId: device_id,
              };

              onConfigChange(updatedConfig);
              saveVkTokenFromConfig(updatedConfig);
            } catch (error: unknown) {
              console.error("VK ID exchange failed:", error);
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
  }, [enabled, config, onConfigChange]);

  const tokenStatus = useMemo(() => {
    if (!config.accessToken) {
      return "Токен не найден";
    }

    if (!config.accessTokenExpiresAt) {
      return "Токен активен (без даты истечения)";
    }

    const expiresAt = new Date(config.accessTokenExpiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
      return "Токен истёк";
    }

    return `Токен истечёт ${expiresAt.toLocaleString()}`;
  }, [config.accessToken, config.accessTokenExpiresAt]);

  const handleOwnerIdChange = (value: string) => {
    onConfigChange({ ...config, ownerId: value });
  };

  const handleClearToken = () => {
    const clearedConfig: VKConfig = {
      ...config,
      accessToken: undefined,
      accessTokenExpiresAt: undefined,
      refreshToken: undefined,
      userId: undefined,
      deviceId: undefined,
    };
    onConfigChange(clearedConfig);
    clearStoredVkToken();
  };

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
            <p className="text-sm text-gray-500">Настройка доступа к VK через VK ID</p>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Включить VK</span>
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
          <div className="space-y-4">
            <div>
              <label htmlFor="vk-owner-id" className="block text-sm font-medium text-gray-700 mb-2">
                Owner ID (отрицательное значение для группы, положительное для профиля)
              </label>
              <input
                id="vk-owner-id"
                type="text"
                placeholder="Например, -123456789"
                value={config.ownerId}
                onChange={(e) => handleOwnerIdChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div className="p-3 bg-blue-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-700 font-medium">Статус токена</p>
                {config.accessToken && (
                  <button
                    type="button"
                    onClick={handleClearToken}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Очистить токен
                  </button>
                )}
              </div>
              <p className="text-xs text-blue-700 leading-relaxed">{tokenStatus}</p>
              {config.userId && (
                <p className="text-xs text-blue-700">Идентификатор пользователя: {config.userId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Авторизация через VK ID
              </label>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div id="vkid-one-tap-container" ref={containerRef} />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Этот блок позволяет получить токен автоматически и синхронизировать его с настройками.
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
