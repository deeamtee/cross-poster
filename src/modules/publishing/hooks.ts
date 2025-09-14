import { useMutation } from '@tanstack/react-query';
import { crossPosterService } from '../../services/cross-poster';
import type { PublishResponse, AppConfig } from '@core/types';
import type { PublishPostVariables } from './types';

export const usePublishPost = () => {
  return useMutation<PublishResponse, Error, PublishPostVariables>({
    mutationFn: async ({ post, config }: PublishPostVariables) => {
      return await crossPosterService.publishPost(post, config);
    },
    onSuccess: (data) => {
      console.log('Post published successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to publish post:', error);
    },
  });
};

export const useGetConfiguredPlatforms = (_config: AppConfig) => {
  // This would need to be implemented based on how platforms are configured
  // For now, returning an empty array as a placeholder
  return [];
};