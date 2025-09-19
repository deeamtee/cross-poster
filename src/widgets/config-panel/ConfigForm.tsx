import React, { useState, useEffect } from "react";
import type { AppConfig, TelegramConfig, VKConfig, Platform } from "@types";
import { TelegramConfigCard } from "./TelegramConfigCard";
import { VKConfigCard } from "./VKConfigCard";
import { getPlatformConfig, updatePlatformConfigInAppConfig } from "./ConfigForm.utils";

interface ConfigFormProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
  showActions?: boolean;
  onClose?: () => void;
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ config, onConfigChange, showActions = true, onClose }) => {
  const [formData, setFormData] = useState<AppConfig>(config);

  useEffect(() => {
    if (!showActions) {
      const timeoutId = setTimeout(() => {
        const isDifferent = JSON.stringify(formData.platforms) !== JSON.stringify(config.platforms);
        if (isDifferent) {
          onConfigChange(formData);
        }
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [formData, config, onConfigChange, showActions]);

  const updatePlatformConfig = (platform: Platform, enabled: boolean, configData: TelegramConfig | VKConfig) => {
    const newConfig = updatePlatformConfigInAppConfig(formData, platform, enabled, configData);
    setFormData(newConfig);
  };

  const telegramConfig = getPlatformConfig(formData, "telegram");
  const vkConfig = getPlatformConfig(formData, "vk");

  const handleSave = () => {
    onConfigChange(formData);
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="space-y-8">
      <TelegramConfigCard
        enabled={telegramConfig.enabled}
        config={telegramConfig.config as TelegramConfig}
        onToggle={(enabled) => updatePlatformConfig("telegram", enabled, telegramConfig.config as TelegramConfig)}
        onConfigChange={(config) => updatePlatformConfig("telegram", true, config)}
      />

      <VKConfigCard
        enabled={vkConfig.enabled}
        config={vkConfig.config as VKConfig}
        onToggle={(enabled) => updatePlatformConfig("vk", enabled, vkConfig.config as VKConfig)}
        onConfigChange={(config) => updatePlatformConfig("vk", true, config)}
      />

      {showActions && (
        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Сохранить настройки
          </button>
        </div>
      )}
    </div>
  );
};
