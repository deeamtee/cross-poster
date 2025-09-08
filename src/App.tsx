import { useState, useEffect } from 'react';
import './App.css';
import { PostForm } from './components/PostForm';
import { ConfigForm } from './components/ConfigForm';
import { PublishResults } from './components/PublishResults';
import { CrossPosterService } from './services';
import type { AppConfig, PostDraft, PublishResponse } from './types';

function App() {
  const [config, setConfig] = useState<AppConfig>({ platforms: [] });
  const [crossPoster, setCrossPoster] = useState<CrossPosterService | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [publishResults, setPublishResults] = useState<PublishResponse | null>(null);

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('cross-poster-config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    }
  }, []);

  // Update cross poster service when config changes
  useEffect(() => {
    if (config.platforms.length > 0) {
      setCrossPoster(new CrossPosterService(config));
    } else {
      setCrossPoster(null);
    }
  }, [config]);

  const handleConfigChange = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem('cross-poster-config', JSON.stringify(newConfig));
  };

  const handlePublishPost = async (post: PostDraft) => {
    if (!crossPoster) {
      alert('Пожалуйста, настройте хотя бы одну платформу перед публикацией');
      return;
    }

    setIsPublishing(true);
    try {
      const results = await crossPoster.publishPost(post);
      setPublishResults(results);
    } catch (error) {
      console.error('Publishing error:', error);
      alert('Произошла ошибка при публикации поста');
    } finally {
      setIsPublishing(false);
    }
  };

  const configuredPlatforms = crossPoster ? crossPoster.getConfiguredPlatforms() : [];

  return (
    <div className="app">
      <header className="app-header">
        <h1>Cross Poster</h1>
        <p>Публикуйте посты одновременно в Telegram и VK</p>
        <button 
          onClick={() => setShowConfig(true)}
          className="btn-secondary config-btn"
        >
          ⚙️ Настройки
        </button>
      </header>

      <main className="app-main">
        <PostForm
          onSubmit={handlePublishPost}
          isPublishing={isPublishing}
          configuredPlatforms={configuredPlatforms}
        />
      </main>

      {showConfig && (
        <ConfigForm
          config={config}
          onConfigChange={handleConfigChange}
          onClose={() => setShowConfig(false)}
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
