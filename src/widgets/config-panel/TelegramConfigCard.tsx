import React from 'react';
import { Card } from '@core/ui/card';
import type { TelegramConfig } from '@core/types';

interface TelegramConfigCardProps {
  enabled: boolean;
  config: TelegramConfig;
  onToggle: (enabled: boolean) => void;
  onConfigChange: (config: TelegramConfig) => void;
}

export const TelegramConfigCard: React.FC<TelegramConfigCardProps> = ({
  enabled,
  config,
  onToggle,
  onConfigChange,
}) => {
  const handleTokenChange = (value: string) => {
    onConfigChange({ ...config, botToken: value });
  };

  const handleIdChange = (value: string) => {
    onConfigChange({ ...config, chatId: value });
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
            <h3 className="text-lg font-semibold text-gray-900">Telegram</h3>
            <p className="text-sm text-gray-500">Настройка бота для публикации постов</p>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Включить Telegram
          </span>
          <label htmlFor="telegram-enabled" className="relative inline-block w-12 h-6 cursor-pointer">
            <input
              type="checkbox"
              id="telegram-enabled"
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
              <label htmlFor="telegram-bot-token" className="block text-sm font-medium text-gray-700 mb-2">
                Bot Token
              </label>
              <input
                id="telegram-bot-token"
                type="password"
                placeholder="Токен бота Telegram"
                value={config.botToken}
                onChange={(e) => handleTokenChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
            
            <div>
              <label htmlFor="telegram-chat-id" className="block text-sm font-medium text-gray-700 mb-2">
                Chat ID
              </label>
              <input
                id="telegram-chat-id"
                type="text"
                placeholder="@channel или ID чата"
                value={config.chatId}
                onChange={(e) => handleIdChange(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>💡 Как получить токен и Chat ID:</strong><br/>
                1. Создайте бота через <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="underline font-medium">@BotFather</a><br/>
                2. Добавьте бота в ваш канал/группу<br/>
                3. Укажите @channel или ID чата в поле ниже
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};