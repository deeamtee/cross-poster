import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainPage } from '@/pages/main-page'
import { SettingsPage } from '@/pages/settings-page'
import { ProfilePage } from '@/pages/profile-page'
import { AccessKeysPage } from '@/pages/access-keys-page'
import { LoginPage } from '@/pages/auth-page'
import { SignUpPage } from '@/pages/auth-page'
import { PasswordResetPage } from '@/pages/auth-page'
import { useAuth } from '@/modules/auth'
import { Spinner } from '@core/ui/spinner'
import type { AppConfig } from '@core/types'
import { configApi } from '@/services/config'
import { SettingsOverviewPage } from '@/pages/settings-overview-page'
import { RedirectIfAuthenticated } from '@/components/RedirectIfAuthenticated'

function App() {
  const { user, loading: authLoading } = useAuth();
  const [config, setConfig] = useState<AppConfig>({ platforms: [] });
  const [configLoading, setConfigLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setConfig({ platforms: [] });
      return;
    }

    const loadConfig = async () => {
      setConfigLoading(true);
      try {
        await configApi.migrateFromLocalStorage();
        
        const savedConfig = await configApi.loadConfig();
        if (savedConfig) {
          setConfig(savedConfig);
        } else {
          setConfig({ platforms: [] });
        }
      } catch (error) {
        console.error('Failed to load config:', error);
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
    
    try {
      await configApi.saveConfig(newConfig);
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Не удалось сохранить конфигурацию. Пожалуйста, попробуйте еще раз.');
    }
  };

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
        {/* Authentication routes - redirect to main page if already authenticated */}
        <Route path="/auth/login" element={<RedirectIfAuthenticated><LoginPage /></RedirectIfAuthenticated>} />
        <Route path="/auth/signup" element={<RedirectIfAuthenticated><SignUpPage /></RedirectIfAuthenticated>} />
        <Route path="/auth/reset-password" element={<RedirectIfAuthenticated><PasswordResetPage /></RedirectIfAuthenticated>} />
        
        {/* Protected routes - only accessible when authenticated */}
        {user ? (
          <>
            <Route path="/" element={<MainPage config={config} configLoading={configLoading} />} />
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
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            {/* Redirect any other routes to main page for authenticated users */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          // Redirect to login if not authenticated
          <Route path="*" element={<LoginPage />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;