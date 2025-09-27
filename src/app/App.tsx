import { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainPage } from '@/pages/main-page';
import { SettingsPage } from '@/pages/settings-page';
import { ProfilePage } from '@/pages/profile-page';
import { AccessKeysPage } from '@/pages/access-keys-page';
import { LoginPage } from '@/pages/auth-page';
import { SignUpPage } from '@/pages/auth-page';
import { PasswordResetPage } from '@/pages/auth-page';
import { VkCommunityAuthPage } from '@/pages/vk-community-auth-page';
import { useAuth } from '@modules/auth';
import { Spinner } from '@/ui/spinner';
import type { AppConfig } from '@types';
import { useConfig } from '@modules/configuration';
import { SettingsOverviewPage } from '@/pages/settings-overview-page';
import { RedirectIfAuthenticated } from '@/widgets/redirect-if-authentificated/RedirectIfAuthenticated';

const emptyConfig: AppConfig = { platforms: [] };

function App() {
  const { user, loading: authLoading } = useAuth();
  const {
    config,
    isLoading: configLoading,
    isFetching: configFetching,
    isSaving,
    saveConfig,
  } = useConfig({ enabled: Boolean(user) });

  const effectiveConfig = useMemo(() => (user ? config : emptyConfig), [config, user]);

  const handleConfigChange = async (newConfig: AppConfig) => {
    if (!user) {
      return;
    }

    await saveConfig(newConfig);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/auth/login" element={<RedirectIfAuthenticated><LoginPage /></RedirectIfAuthenticated>} />
        <Route path="/auth/signup" element={<RedirectIfAuthenticated><SignUpPage /></RedirectIfAuthenticated>} />
        <Route path="/auth/reset-password" element={<RedirectIfAuthenticated><PasswordResetPage /></RedirectIfAuthenticated>} />
        <Route path="/vk-community-auth" element={<VkCommunityAuthPage />} />

        {user ? (
          <>
            <Route
              path="/"
              element={<MainPage config={effectiveConfig} configLoading={configLoading || configFetching} />}
            />
            <Route path="/settings" element={<SettingsPage />}>
              <Route index element={<SettingsOverviewPage />} />
              <Route
                path="access-keys"
                element={
                  <AccessKeysPage
                    config={effectiveConfig}
                    onConfigChange={handleConfigChange}
                    isSaving={isSaving}
                  />
                }
              />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <Route path="*" element={<LoginPage />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;