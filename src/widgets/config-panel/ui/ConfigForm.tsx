import React, { useState, useEffect } from 'react';
import type { AppConfig, TelegramConfig, VKConfig } from '../../../shared/types';
import { vkidService } from '../../../shared/lib';

interface ConfigFormProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
  showActions?: boolean;
  onClose?: () => void;
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ 
  config, 
  onConfigChange, 
  showActions = true,
  onClose 
}) => {
  const [formData, setFormData] = useState<AppConfig>(config);
  const [authError, setAuthError] = useState<string>();
  const [isVKIDAuthenticating, setIsVKIDAuthenticating] = useState(false);

  useEffect(() => {
    setFormData(config);
  }, [config]);

  // Auto-save with debounce when showActions is false
  useEffect(() => {
    if (!showActions) {
      const timeoutId = setTimeout(() => {
        if (JSON.stringify(formData) !== JSON.stringify(config)) {
          onConfigChange(formData);
        }
      }, 1000); // 1 second debounce

      return () => clearTimeout(timeoutId);
    }
  }, [formData, config, onConfigChange, showActions]);

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
    if (onClose) {
      onClose();
    }
  };

  const handleVKIDAuth = async () => {
    setIsVKIDAuthenticating(true);
    setAuthError(undefined);
    
    try {
      const clientId = import.meta.env.VITE_VK_CLIENT_ID || prompt('Введите Client ID вашего VK приложения:');
      if (!clientId) {
        setAuthError('Client ID обязателен для VK ID авторизации');
        return;
      }

      console.log('Starting VK ID authentication with Client ID:', clientId);
      console.log('Current origin:', window.location.origin);

      // Инициализируем VK ID SDK
      try {
        await vkidService.initializeSDK(parseInt(clientId));
        console.log('VK ID SDK initialized successfully');
      } catch (initError) {
        console.error('VK ID SDK initialization failed:', initError);
        
        // If it's a CORS error, suggest using regular OAuth instead
        if (initError instanceof Error && (initError.message.includes('CORS') || initError.message.includes('fetch'))) {
          setAuthError(`VK ID SDK CORS Error ❌
            
🔧 РЕШЕНИЕ ПРОБЛЕМЫ:
1. Откройте vk.com/apps?act=manage
2. Выберите ваше приложение → вкладка "VK ID"
3. В разделе "Доверенные домены" добавьте: ${window.location.origin}
4. Сохраните настройки и попробуйте снова

🔄 АЛЬТЕРНАТИВА: Используйте обычный OAuth (синяя кнопка ниже)
            
Технические детали: ${initError.message}`);
        } else {
          setAuthError(`Ошибка инициализации VK ID SDK: ${initError instanceof Error ? initError.message : 'Неизвестная ошибка'}`);
        }
        return;
      }

      // Создаем временный контейнер для кнопки One Tap
      const container = document.createElement('div');
      container.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10000;
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        min-width: 300px;
      `;
      
      // Добавляем заголовок
      const title = document.createElement('h3');
      title.textContent = 'Авторизация через VK ID';
      title.style.cssText = 'margin: 0 0 15px 0; text-align: center;';
      container.appendChild(title);

      // Добавляем описание
      const description = document.createElement('p');
      description.textContent = 'Нажмите кнопку VK ID для авторизации';
      description.style.cssText = 'margin: 0 0 15px 0; text-align: center; color: #666; font-size: 14px;';
      container.appendChild(description);

      document.body.appendChild(container);

      // Создаем оверлей
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
      `;
      
      // Закрытие по клику на оверлей
      overlay.onclick = () => {
        if (container.parentNode) document.body.removeChild(container);
        if (overlay.parentNode) document.body.removeChild(overlay);
        setIsVKIDAuthenticating(false);
      };
      
      document.body.appendChild(overlay);

      try {
        const result = await vkidService.authenticateWithOneTap(container);
        console.log('VK ID authentication successful:', result);
        
        updatePlatformConfig('vk', true, {
          ...getVKConfig().config,
          accessToken: result.accessToken,
        });
        
        setAuthError(undefined);
      } catch (authError) {
        console.error('VK ID authentication failed:', authError);
        
        // Check if it's a CORS-related authentication error
        if (authError instanceof Error && (authError.message.includes('CORS') || authError.message.includes('fetch'))) {
          setAuthError(`VK ID авторизация заблокирована CORS политикой. 
            Решения:
            1. Добавьте ${window.location.origin} в "Доверенные домены" VK приложения
            2. Используйте обычный OAuth вместо VK ID (синяя кнопка)
            
            Подробности: ${authError.message}`);
        } else {
          setAuthError(`VK ID авторизация не удалась: ${authError instanceof Error ? authError.message : 'Неизвестная ошибка'}`);
        }
      } finally {
        // Очищаем UI
        if (container.parentNode) {
          document.body.removeChild(container);
        }
        if (overlay.parentNode) {
          document.body.removeChild(overlay);
        }
      }
    } catch (error) {
      console.error('VK ID process failed:', error);
      setAuthError(`Не удалось запустить VK ID авторизацию: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsVKIDAuthenticating(false);
    }
  };

  const handleVKIDPopup = async () => {
    setIsVKIDAuthenticating(true);
    setAuthError(undefined);
    
    try {
      const clientId = import.meta.env.VITE_VK_CLIENT_ID || prompt('Введите Client ID вашего VK ID приложения:');
      if (!clientId) {
        setAuthError('Client ID обязателен для VK ID авторизации');
        return;
      }

      // Инициализируем SDK
      await vkidService.initializeSDK(parseInt(clientId));
      
      // Используем Popup авторизацию
      const result = await vkidService.authenticateWithPopup();
      
      updatePlatformConfig('vk', true, {
        ...getVKConfig().config,
        accessToken: result.accessToken,
      });
      
      setAuthError(undefined);
    } catch (error) {
      console.error('VK ID popup authentication failed:', error);
      setAuthError(`Popup авторизация не удалась: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsVKIDAuthenticating(false);
    }
  };

  const telegramConfig = getTelegramConfig();
  const vkConfig = getVKConfig();

  return (
    <div className="space-y-8">
      {/* Telegram Configuration */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Telegram</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={telegramConfig.enabled}
                  onChange={(e) => 
                    updatePlatformConfig('telegram', e.target.checked, telegramConfig.config)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">Публикация сообщений в Telegram каналы и чаты</p>
          </div>
        </div>
        
        {telegramConfig.enabled && (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <label htmlFor="telegram-bot-token" className="block text-sm font-medium text-gray-700 mb-2">
                  Bot Token
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
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Получите токен от @BotFather в Telegram
                </p>
              </div>
              
              <div>
                <label htmlFor="telegram-chat-id" className="block text-sm font-medium text-gray-700 mb-2">
                  Chat ID / Channel
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
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Username канала (@mychannel) или Chat ID
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* VK Configuration */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zM18.968 9.316l-1.576 7.368c-.184.868-.476 1.184-.776 1.184-.524 0-.868-.316-1.736-1.184-.576-.604-1.472-1.052-2.316-1.736-.604-.472-.316-.736.132-1.184.132-.132 2.42-2.288 2.604-2.604.132-.236-.132-.368-.368-.236-.236.132-2.948 1.908-5.264 3.816-.552.368-.776.552-1.316.552-.604 0-1.736-.316-2.604-.604-1.052-.368-1.84-.604-1.84-1.316 0-.368.316-.736 1.052-1.052 4.236-1.84 7.052-3.052 8.448-3.632 4.052-1.64 4.888-1.908 5.448-1.908.132 0 .236.132.236.236 0 .132-.132.604-.132.868z"/>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">VKontakte</h3>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={vkConfig.enabled}
                  onChange={(e) => 
                    updatePlatformConfig('vk', e.target.checked, vkConfig.config)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">Публикация постов на стену или в группу VK</p>
          </div>
        </div>
        
        {vkConfig.enabled && (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <label htmlFor="vk-access-token" className="block text-sm font-medium text-gray-700 mb-2">
                  Access Token
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
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Получите токен с правами wall,photos,groups
                </p>
                
                {/* OAuth Authentication Section */}
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-800 mb-3">
                    🔑 Способы получения токена:
                  </p>
                  
                  {/* VK ID OneTap кнопка */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleVKIDAuth}
                      disabled={isVKIDAuthenticating}
                      className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {isVKIDAuthenticating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          VK ID авторизация...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">🆕</span>
                          VK ID OneTap (рекомендуется)
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleVKIDPopup}
                      disabled={isVKIDAuthenticating}
                      className="w-full inline-flex items-center justify-center px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isVKIDAuthenticating ? 'Ожидание...' : (
                        <>
                          <span className="mr-2">🔄</span>
                          VK ID Popup (альтернатива)
                        </>
                      )}
                    </button>
                    
                    <p className="text-xs text-green-600 mt-2">
                      ✨ Современная безопасная авторизация VK с 2024 года
                    </p>
                  </div>

                  {authError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                      {authError}
                    </div>
                  )}
                  
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700 leading-relaxed">
                      <strong>📝 Важная информация:</strong><br/>
                      • Создайте <strong>VK ID приложение</strong> на <a href="https://id.vk.com/about/business/go/" target="_blank" rel="noopener noreferrer" className="underline font-medium">id.vk.com</a><br/>
                      • Настройте базовые домены и redirect URLs<br/>
                      • Для разработки: добавьте <code className="bg-white px-1 rounded text-xs font-mono">{window.location.origin}</code> в настройки VK ID
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="vk-group-id" className="block text-sm font-medium text-gray-700 mb-2">
                  Group ID (опционально)
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
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <p className="text-sm text-gray-500 mt-2">
                  ID группы для постинга (только цифры)
                </p>
              </div>
              
              <div>
                <label htmlFor="vk-user-id" className="block text-sm font-medium text-gray-700 mb-2">
                  User ID (опционально)
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
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <p className="text-sm text-gray-500 mt-2">
                  ID пользователя для постинга на свою стену (только цифры)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {showActions && (
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Сохранить
          </button>
        </div>
      )}
    </div>
  );
};