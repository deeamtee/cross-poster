import { useState, useEffect } from 'react';
import { MainPage } from '../pages';
import { useAuth } from '../features/auth/model';
import { configApi } from '../shared/api';
import { Spinner } from '../shared/ui';
import type { AppConfig } from '../shared/types';

function App() {
  const { user, loading: authLoading } = useAuth();
  const [config, setConfig] = useState<AppConfig>({ platforms: [] });
  const [configLoading, setConfigLoading] = useState(false);

  // Load config from Firestore on mount and when user changes
  useEffect(() => {
    if (!user) {
      // Clear config when user logs out
      setConfig({ platforms: [] });
      return;
    }

    // Load user-specific config from Firestore
    const loadConfig = async () => {
      setConfigLoading(true);
      try {
        // First, try to migrate from localStorage if needed
        await configApi.migrateFromLocalStorage();
        
        // Load from Firestore
        const savedConfig = await configApi.loadConfig();
        if (savedConfig) {
          setConfig(savedConfig);
        }
      } catch (error) {
        console.error('Failed to load config:', error);
        // Fallback to empty config
        setConfig({ platforms: [] });
      } finally {
        setConfigLoading(false);
      }
    };

    loadConfig();
  }, [user]);

  const handleConfigChange = async (newConfig: AppConfig) => {
    if (!user) return;
    
    setConfig(newConfig);
    
    // Save to Firestore
    try {
      await configApi.saveConfig(newConfig);
      console.log('Configuration saved securely');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      // Show user-friendly error message
      alert('Не удалось сохранить конфигурацию. Пожалуйста, попробуйте еще раз.');
    }
  };

  // Show loading screen while authentication is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <MainPage
      config={config}
      onConfigChange={handleConfigChange}
      configLoading={configLoading}
    />
  );
}

export default App;