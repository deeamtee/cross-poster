import React, { useState } from 'react';
import { Header } from '../../../widgets/header';
import { PostComposer } from '../../../widgets/post-composer';
import { PublishResultsModal } from '../../../modules/publishing/components';
import { AuthModal } from '../../../modules/auth/components';
import { useAuth } from '../../../modules/auth/hooks/context';
import type { AppConfig, PublishResponse } from '../../../core/types';

interface MainPageProps {
  config: AppConfig;
  configLoading: boolean;
}

export const MainPage: React.FC<MainPageProps> = ({ 
  config, 
  configLoading 
}) => {
  const { isAuthenticated } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [publishResults, setPublishResults] = useState<PublishResponse | null>(null);

  const handleAuthClick = () => {
    setShowAuth(true);
  };

  const handlePublishComplete = (results: PublishResponse) => {
    setPublishResults(results);
  };

  if (configLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка конфигурации...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        onAuthClick={handleAuthClick}
      />

      <main className="container mx-auto px-4 py-8">
        {isAuthenticated ? (
          <PostComposer
            config={config}
            onPublishComplete={handlePublishComplete}
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
              onClick={handleAuthClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-lg"
            >
              Начать работу
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
      />

      <PublishResultsModal
        results={publishResults}
        onClose={() => setPublishResults(null)}
      />
    </div>
  );
};