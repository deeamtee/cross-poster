import type { PostDraft, AppConfig } from '@types';

export interface PublishPostVariables {
  post: PostDraft;
  config: AppConfig;
}
