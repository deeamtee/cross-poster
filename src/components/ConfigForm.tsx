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
    <div className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Настройка платформ</h2>
          <p className="text-gray-600 mt-1">Настройте платформы для кросс-постинга</p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Telegram Configuration */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="telegram-enabled"
                checked={telegramConfig.enabled}
                onChange={(e) => 
                  updatePlatformConfig('telegram', e.target.checked, telegramConfig.config)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="telegram-enabled" className="text-lg font-semibold text-gray-800 cursor-pointer">
                Telegram
              </label>
            </div>
            
            {telegramConfig.enabled && (
              <div className="space-y-4 ml-6">
                <div>
                  <label htmlFor="telegram-bot-token" className="block text-sm font-medium text-gray-700 mb-1">
                    Bot Token:
                  </label>
                  <input
                    id="telegram-bot-token"
                    type="password"
                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                    value={telegramConfig.config.botToken}
                    onChange={(e) => updatePlatformConfig('telegram', true, {
                      ...telegramConfig.config,
                      botToken: e.target.value,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Получите токен от @BotFather в Telegram
                  </p>
                </div>
                
                <div>
                  <label htmlFor="telegram-chat-id" className="block text-sm font-medium text-gray-700 mb-1">
                    Chat ID / Channel:
                  </label>
                  <input
                    id="telegram-chat-id"
                    type="text"
                    placeholder="@mychannel или -1001234567890"
                    value={telegramConfig.config.chatId}
                    onChange={(e) => updatePlatformConfig('telegram', true, {
                      ...telegramConfig.config,
                      chatId: e.target.value,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Username канала (@mychannel) или Chat ID
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* VK Configuration */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="vk-enabled"
                checked={vkConfig.enabled}
                onChange={(e) => 
                  updatePlatformConfig('vk', e.target.checked, vkConfig.config)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="vk-enabled" className="text-lg font-semibold text-gray-800 cursor-pointer">
                VK
              </label>
            </div>
            
            {vkConfig.enabled && (
              <div className="space-y-4 ml-6">
                <div>
                  <label htmlFor="vk-access-token" className="block text-sm font-medium text-gray-700 mb-1">
                    Access Token:
                  </label>
                  <input
                    id="vk-access-token"
                    type="password"
                    placeholder="Токен доступа VK"
                    value={vkConfig.config.accessToken}
                    onChange={(e) => updatePlatformConfig('vk', true, {
                      ...vkConfig.config,
                      accessToken: e.target.value,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Получите токен на{' '}
                    <a 
                      href="https://vkhost.github.io/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      vkhost.github.io
                    </a>
                    {' '}с правами wall,photos,groups
                  </p>
                </div>
                
                <div>
                  <label htmlFor="vk-group-id" className="block text-sm font-medium text-gray-700 mb-1">
                    Group ID (опционально):
                  </label>
                  <input
                    id="vk-group-id"
                    type="text"
                    placeholder="123456789"
                    value={vkConfig.config.groupId || ''}
                    onChange={(e) => updatePlatformConfig('vk', true, {
                      ...vkConfig.config,
                      groupId: e.target.value,
                      userId: e.target.value ? '' : vkConfig.config.userId,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    ID группы для постинга (только цифры)
                  </p>
                </div>
                
                <div>
                  <label htmlFor="vk-user-id" className="block text-sm font-medium text-gray-700 mb-1">
                    User ID (опционально):
                  </label>
                  <input
                    id="vk-user-id"
                    type="text"
                    placeholder="123456789"
                    value={vkConfig.config.userId || ''}
                    onChange={(e) => updatePlatformConfig('vk', true, {
                      ...vkConfig.config,
                      userId: e.target.value,
                      groupId: e.target.value ? '' : vkConfig.config.groupId,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    ID пользователя для постинга на свою стену (только цифры)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};