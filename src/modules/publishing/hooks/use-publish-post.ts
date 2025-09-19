import { useMutation } from '@tanstack/react-query';
import { crossPosterService } from '../api';
import type { PublishResponse, AppConfig } from '@types';
import { getConfiguredPlatforms } from '@modules/platform';
import type { PublishPostVariables } from '../types';

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

export const useGetConfiguredPlatforms = (config: AppConfig) => {
  return getConfiguredPlatforms(config);
};
