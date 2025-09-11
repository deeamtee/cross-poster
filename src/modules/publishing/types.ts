import type { PostDraft, AppConfig } from '../../core/types';

export interface PublishPostVariables {
  post: PostDraft;
  config: AppConfig;
}