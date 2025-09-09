import { useState, useEffect } from 'react';
import { PostForm } from './components/PostForm';
import { ConfigForm } from './components/ConfigForm';
import { PublishResults } from './components/PublishResults';
import { AuthModal, UserMenu } from './components/auth';
import { useAuth } from './contexts';
import { usePublishPost, useGetConfiguredPlatforms } from './hooks';
import { SecureConfigService } from './services';
import type { AppConfig, PostDraft, PublishResponse } from './types';

function App() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [config, setConfig] = useState<AppConfig>({ platforms: [] });
  const [showConfig, setShowConfig] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [publishResults, setPublishResults] = useState<PublishResponse | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  
  // React Query mutation for publishing posts
  const publishPostMutation = usePublishPost();
  
  // Get configured platforms
  const configuredPlatforms = useGetConfiguredPlatforms(config);

  // Initialize secure config service
  const configService = new SecureConfigService();

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
        await configService.migrateFromLocalStorage();
        
        // Load from Firestore
        const savedConfig = await configService.loadConfig();
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

  // Close auth modal when user successfully logs in
  useEffect(() => {
    if (isAuthenticated && showAuth) {
      setShowAuth(false);
    }
  }, [isAuthenticated, showAuth]);



  const handleConfigChange = async (newConfig: AppConfig) => {
    if (!user) return;
    
    setConfig(newConfig);
    
    // Save to Firestore instead of localStorage
    try {
      await configService.saveConfig(newConfig);
      console.log('Configuration saved securely');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      // Show user-friendly error message
      alert('Не удалось сохранить конфигурацию. Пожалуйста, попробуйте еще раз.');
    }
  };

  const handlePublishPost = async (post: PostDraft) => {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }

    if (!config.platforms.some(p => p.enabled)) {
      alert('Пожалуйста, настройте хотя бы одну платформу перед публикацией');
      return;
    }

    try {
      const result = await publishPostMutation.mutateAsync({ post, config });
      setPublishResults(result);
    } catch (error) {
      console.error('Publishing error:', error);
      alert('Произошла ошибка при публикации поста');
    }
  };

  // Show loading screen while authentication is initializing or config is loading
  if (authLoading || configLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? 'Загрузка...' : 'Загрузка конфигурации...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Cross Poster
              </h1>
              <p className="text-gray-600">
                Публикуйте посты одновременно в Telegram и VK
              </p>
            </div>
            
            {isAuthenticated ? (
              <UserMenu onSettingsClick={() => setShowConfig(true)} />
            ) : (
              <button 
                onClick={() => setShowAuth(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {isAuthenticated ? (
          <PostForm
            onSubmit={handlePublishPost}
            isPublishing={publishPostMutation.isPending}
            configuredPlatforms={configuredPlatforms}
          />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Добро пожаловать в Cross Poster!
            </h2>
            <p className="text-gray-600 mb-8">
              Войдите в систему, чтобы начать публиковать посты в социальные сети
            </p>
            <button
              onClick={() => setShowAuth(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-lg"
            >
              Начать работу
            </button>
          </div>
        )}
      </main>

      {showConfig && isAuthenticated && (
        <ConfigForm
          config={config}
          onConfigChange={handleConfigChange}
          onClose={() => setShowConfig(false)}
        />
      )}

      {showAuth && (
        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
        />
      )}

      {publishResults && (
        <PublishResults
          results={publishResults}
          onClose={() => setPublishResults(null)}
        />
      )}
    </div>
  );
}

export default App;
