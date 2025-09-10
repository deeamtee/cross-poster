import type { PostDraft, AppConfig } from '../../../shared/types';

export interface PublishPostVariables {
  post: PostDraft;
  config: AppConfig;
}