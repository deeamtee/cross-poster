import React, { useState } from 'react';
import { Header } from '@/widgets/header';
import { PostComposer } from '@/widgets/post-composer';
import { PublishResultsModal } from '@modules/publishing';
import { AuthModal, useAuth } from '@modules/auth';
import type { AppConfig, PublishResponse } from '@types';

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
          <p className="text-gray-600">Р—Р°РіСЂСѓР·РєР° РєРѕРЅС„РёРіСѓСЂР°С†РёРё...</p>
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
              Р”РѕР±СЂРѕ РїРѕР¶Р°Р»РѕРІР°С‚СЊ РІ Cross Poster!
            </h2>
            <p className="text-gray-600 mb-8">
              Р’РѕР№РґРёС‚Рµ РІ СЃРёСЃС‚РµРјСѓ, С‡С‚РѕР±С‹ РЅР°С‡Р°С‚СЊ РїСѓР±Р»РёРєРѕРІР°С‚СЊ РїРѕСЃС‚С‹ РІ СЃРѕС†РёР°Р»СЊРЅС‹Рµ СЃРµС‚Рё
            </p>
            <button
              onClick={handleAuthClick}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors text-lg"
            >
              РќР°С‡Р°С‚СЊ СЂР°Р±РѕС‚Сѓ
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
