import React, { useState } from 'react';
import { getConfiguredPlatforms } from '../../../entities/platform';
import { CrossPosterService } from '../../../shared/api/cross-poster';
import { PostForm } from './PostForm';
import type { AppConfig, PostDraft, PublishResponse } from '../../../shared/types';

interface PostComposerProps {
  config: AppConfig;
  onPublishComplete: (results: PublishResponse) => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({ config, onPublishComplete }) => {
  const [isPublishing, setIsPublishing] = useState(false);
  
  const configuredPlatforms = getConfiguredPlatforms(config);
  
  const handleSubmit = async (post: PostDraft) => {
    setIsPublishing(true);
    
    try {
      const crossPoster = new CrossPosterService(config);
      const results = await crossPoster.publishPost(post);
      onPublishComplete(results);
    } catch (error) {
      console.error('Publishing failed:', error);
      onPublishComplete({
        results: [{
          platform: 'telegram',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }],
        totalSuccess: 0,
        totalFailure: 1,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <PostForm
      onSubmit={handleSubmit}
      isPublishing={isPublishing}
      configuredPlatforms={configuredPlatforms}
    />
  );
};