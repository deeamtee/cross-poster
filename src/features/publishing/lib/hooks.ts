import { useMutation } from '@tanstack/react-query';
import { CrossPosterService } from '../../../shared/api';
import { getConfiguredPlatforms } from '../../../entities/platform';
import type { PublishResponse, AppConfig } from '../../../shared/types';
import type { PublishPostVariables } from './types';

export const usePublishPost = () => {
  return useMutation<PublishResponse, Error, PublishPostVariables>({
    mutationFn: async ({ post, config }: PublishPostVariables) => {
      const crossPoster = new CrossPosterService(config);
      return await crossPoster.publishPost(post);
    },
    onSuccess: (data) => {
      console.log('Post published successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to publish post:', error);
    },
  });
};

export const useGetConfiguredPlatforms = (config: AppConfig) => {
  return getConfiguredPlatforms(config);
};