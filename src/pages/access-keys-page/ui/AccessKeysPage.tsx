import React, { useState } from 'react';
import { ConfigPanel } from '../../../widgets/config-panel';
import type { AppConfig } from '../../../core/types';

interface AccessKeysPageProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
}

export const AccessKeysPage: React.FC<AccessKeysPageProps> = ({ 
  config, 
  onConfigChange 
}) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const handleConfigChange = async (newConfig: AppConfig) => {
    setIsAutoSaving(true);
    try {
      await onConfigChange(newConfig);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save configuration:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Ключи доступа</h1>
          <div className="flex items-center space-x-2">
            {isAutoSaving && (
              <div className="flex items-center text-sm text-blue-600">
                <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Сохранение...
              </div>
            )}
            {lastSaved && !isAutoSaving && (
              <div className="text-sm text-green-600">
                ✓ Сохранено {lastSaved.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
        <p className="text-gray-600">
          Настройте ключи доступа для публикации контента на различных платформах. Изменения сохраняются автоматически.
        </p>
      </div>
      
      <ConfigPanel
        config={config}
        onConfigChange={handleConfigChange}
        showActions={false}
      />
    </div>
  );
};