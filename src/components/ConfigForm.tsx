import React, { useState, useEffect } from 'react';
import type { AppConfig, TelegramConfig, VKConfig } from '../types';

interface ConfigFormProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
  onClose: () => void;
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ config, onConfigChange, onClose }) => {
  const [formData, setFormData] = useState<AppConfig>(config);

  useEffect(() => {
    setFormData(config);
  }, [config]);

  const updatePlatformConfig = (platform: 'telegram' | 'vk', enabled: boolean, configData: TelegramConfig | VKConfig) => {
    const newPlatforms = formData.platforms.map(p => {
      if (p.platform === platform) {
        return { ...p, enabled, config: configData };
      }
      return p;
    });

    // If platform doesn't exist, add it
    if (!formData.platforms.find(p => p.platform === platform)) {
      newPlatforms.push({
        platform,
        enabled,
        config: configData,
      });
    }

    setFormData({ ...formData, platforms: newPlatforms });
  };

  const getTelegramConfig = (): { enabled: boolean; config: TelegramConfig } => {
    const platform = formData.platforms.find(p => p.platform === 'telegram');
    return {
      enabled: platform?.enabled || false,
      config: platform?.config as TelegramConfig || { botToken: '', chatId: '' },
    };
  };

  const getVKConfig = (): { enabled: boolean; config: VKConfig } => {
    const platform = formData.platforms.find(p => p.platform === 'vk');
    return {
      enabled: platform?.enabled || false,
      config: platform?.config as VKConfig || { accessToken: '', groupId: '', userId: '' },
    };
  };

  const handleSave = () => {
    onConfigChange(formData);
    onClose();
  };

  const telegramConfig = getTelegramConfig();
  const vkConfig = getVKConfig();

  return (
    <div className="config-form-overlay">
      <div className="config-form">
        <h2>Настройка платформ</h2>
        
        {/* Telegram Configuration */}
        <div className="platform-config">
          <h3>
            <label>
              <input
                type="checkbox"
                checked={telegramConfig.enabled}
                onChange={(e) => updatePlatformConfig('telegram', e.target.checked, telegramConfig.config)}
              />
              Telegram
            </label>
          </h3>
          
          {telegramConfig.enabled && (
            <div className="config-fields">
              <div className="field">
                <label htmlFor="telegram-bot-token">Bot Token:</label>
                <input
                  id="telegram-bot-token"
                  type="password"
                  placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  value={telegramConfig.config.botToken}
                  onChange={(e) => updatePlatformConfig('telegram', true, {
                    ...telegramConfig.config,
                    botToken: e.target.value,
                  })}
                />
                <small>Получите токен от @BotFather в Telegram</small>
              </div>
              
              <div className="field">
                <label htmlFor="telegram-chat-id">Chat ID / Channel:</label>
                <input
                  id="telegram-chat-id"
                  type="text"
                  placeholder="@mychannel или -1001234567890"
                  value={telegramConfig.config.chatId}
                  onChange={(e) => updatePlatformConfig('telegram', true, {
                    ...telegramConfig.config,
                    chatId: e.target.value,
                  })}
                />
                <small>Username канала (@mychannel) или Chat ID</small>
              </div>
            </div>
          )}
        </div>

        {/* VK Configuration */}
        <div className="platform-config">
          <h3>
            <label>
              <input
                type="checkbox"
                checked={vkConfig.enabled}
                onChange={(e) => updatePlatformConfig('vk', e.target.checked, vkConfig.config)}
              />
              VK
            </label>
          </h3>
          
          {vkConfig.enabled && (
            <div className="config-fields">
              <div className="field">
                <label htmlFor="vk-access-token">Access Token:</label>
                <input
                  id="vk-access-token"
                  type="password"
                  placeholder="Токен доступа VK"
                  value={vkConfig.config.accessToken}
                  onChange={(e) => updatePlatformConfig('vk', true, {
                    ...vkConfig.config,
                    accessToken: e.target.value,
                  })}
                />
                <small>
                  Получите токен на{' '}
                  <a href="https://vkhost.github.io/" target="_blank" rel="noopener noreferrer">
                    vkhost.github.io
                  </a>
                  {' '}с правами wall,photos,groups
                </small>
              </div>
              
              <div className="field">
                <label htmlFor="vk-group-id">Group ID (опционально):</label>
                <input
                  id="vk-group-id"
                  type="text"
                  placeholder="123456789"
                  value={vkConfig.config.groupId || ''}
                  onChange={(e) => updatePlatformConfig('vk', true, {
                    ...vkConfig.config,
                    groupId: e.target.value,
                    userId: e.target.value ? '' : vkConfig.config.userId, // Clear userId if groupId is set
                  })}
                />
                <small>ID группы для постинга (только цифры)</small>
              </div>
              
              <div className="field">
                <label htmlFor="vk-user-id">User ID (опционально):</label>
                <input
                  id="vk-user-id"
                  type="text"
                  placeholder="123456789"
                  value={vkConfig.config.userId || ''}
                  disabled={!!vkConfig.config.groupId}
                  onChange={(e) => updatePlatformConfig('vk', true, {
                    ...vkConfig.config,
                    userId: e.target.value,
                  })}
                />
                <small>ID пользователя для постинга на стену (альтернатива Group ID)</small>
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button onClick={handleSave} className="btn-primary">
            Сохранить
          </button>
          <button onClick={onClose} className="btn-secondary">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};