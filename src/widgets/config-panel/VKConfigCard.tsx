import React from 'react';
import { Card } from '@core/ui/card';
import type { VKConfig } from '@core/types';

interface VKConfigCardProps {
  enabled: boolean;
  config: VKConfig;
  onToggle: (enabled: boolean) => void;
  onConfigChange: (config: VKConfig) => void;
}

export const VKConfigCard: React.FC<VKConfigCardProps> = ({
  enabled,
  config,
  onToggle,
  onConfigChange,
}) => {
  const handleTokenChange = (value: string) => {
    onConfigChange({ ...config, groupToken: value });
  };

  const handleIdChange = (value: string) => {
    onConfigChange({ ...config, groupId: value });
  };

  return (
    <Card 
      header={
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.14.141-.259.259-.374.261l.213-3.053 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.136-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">VK</h3>
            <p className="text-sm text-gray-500">Настройка группы для публикации постов</p>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Включить VK
          </span>
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
              <label htmlFor="vk-group-token" className="block text-sm font-medium text-gray-700 mb-2">
                Group Token
              </label>
              <input
                id="vk-group-token"
                type="password"
                placeholder="Токен группы VK"
                value={config.groupToken}
                onChange={(e) => handleTokenChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
            
            <div>
              <label htmlFor="vk-group-id" className="block text-sm font-medium text-gray-700 mb-2">
                Group ID
              </label>
              <input
                id="vk-group-id"
                type="text"
                placeholder="ID группы VK"
                value={config.groupId}
                onChange={(e) => handleIdChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>💡 Как получить токен и ID группы:</strong><br/>
                1. Создайте токен доступа для группы с правами на постинг<br/>
                2. Найдите ID вашей группы в настройках<br/>
                3. Укажите токен и ID группы в полях ниже
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};