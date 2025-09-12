import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainPage, SettingsPage, AccessKeysPage, SettingsOverviewPage } from '../pages';
import { ProfilePage } from '../pages/profile-page';
import { useAuth } from '../modules/auth/hooks/context';
import { configApi } from '../services/config';
import { Spinner } from '../core/ui/spinner';
import type { AppConfig } from '../core/types';

function App() {
  const { user, loading: authLoading } = useAuth();
  const [config, setConfig] = useState<AppConfig>({ platforms: [] });
  const [configLoading, setConfigLoading] = useState(false);

  // Load config from Firestore on mount and when user changes
  useEffect(() => {
    if (!user) {
      // Clear config when user logs out
      console.log('User logged out, clearing config');
      setConfig({ platforms: [] });
      return;
    }

    // Load user-specific config from Firestore
    const loadConfig = async () => {
      setConfigLoading(true);
      try {
        console.log('Loading config for user:', user.uid);
        // First, try to migrate from localStorage if needed
        await configApi.migrateFromLocalStorage();
        
        // Load from Firestore
        const savedConfig = await configApi.loadConfig();
        console.log('Loaded config:', savedConfig);
        if (savedConfig) {
          setConfig(savedConfig);
        } else {
          console.log('No saved config found, using default config');
          setConfig({ platforms: [] });
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
    
    console.log('Config changed:', newConfig);
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
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            <MainPage
              config={config}
              configLoading={configLoading}
            />
          } 
        />
        <Route path="/settings" element={<SettingsPage />}>
          <Route index element={<SettingsOverviewPage />} />
          <Route 
            path="access-keys" 
            element={
              <AccessKeysPage
                config={config}
                onConfigChange={handleConfigChange}
              />
            } 
          />
          <Route 
            path="profile" 
            element={<ProfilePage />} 
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;