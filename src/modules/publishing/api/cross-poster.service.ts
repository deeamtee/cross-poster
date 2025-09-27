import type {
  AppConfig,
  PostDraft,
  PublishResponse,
  PostResult,
  TelegramConfig,
  VKConfig,
  PlatformConfig,
  VKCommunityToken,
} from '@types';
import { TelegramService } from './telegram.service';
import { VKService } from './vk.service';
import { mergeVkConfigWithStoredToken, saveVkTokenFromConfig } from '../lib';

const hasActiveVkCommunity = (vkConfig?: VKConfig): boolean => {
  if (!vkConfig || !Array.isArray(vkConfig.communities)) {
    return false;
  }

  return vkConfig.communities.some((community: VKCommunityToken) =>
    community.isSelected && typeof community.accessToken === 'string' && community.accessToken.length > 0,
  );
};

export class CrossPosterService {
  private telegramConfig?: TelegramConfig;
  private vkConfig?: VKConfig;

  constructor(config: AppConfig) {
    this.updateConfig(config);
  }

  updateConfig(config: AppConfig) {
    this.telegramConfig = undefined;
    this.vkConfig = undefined;

    config.platforms.forEach((platformConfig: PlatformConfig) => {
      if (!platformConfig.enabled) {
        return;
      }

      switch (platformConfig.platform) {
        case 'telegram':
          this.telegramConfig = platformConfig.config as TelegramConfig;
          break;
        case 'vk':
          this.vkConfig = platformConfig.config as VKConfig;
          break;
      }
    });
  }

  async publishPost(post: PostDraft, config: AppConfig): Promise<PublishResponse> {
    this.updateConfig(config);

    const results: PostResult[] = [];

    if (this.telegramConfig) {
      const telegramService = new TelegramService(this.telegramConfig);
      const result = post.images && post.images.length > 0
        ? await telegramService.publishPostWithImages(post)
        : await telegramService.publishPost(post);
      results.push(result);
    }

    if (this.vkConfig) {
      const mergedVkConfig = mergeVkConfigWithStoredToken(this.vkConfig);
      Object.assign(this.vkConfig, mergedVkConfig);
      saveVkTokenFromConfig(this.vkConfig);

      const vkService = new VKService(this.vkConfig);
      const vkResults = post.images && post.images.length > 0
        ? await vkService.publishPostWithImages(post)
        : await vkService.publishPost(post);
      results.push(...vkResults);
    }

    const totalSuccess = results.filter((result) => result.success).length;
    const totalFailure = results.filter((result) => !result.success).length;

    return {
      results,
      totalSuccess,
      totalFailure,
    };
  }

  getConfiguredPlatforms(): string[] {
    const platforms: string[] = [];

    if (this.telegramConfig) {
      platforms.push('telegram');
    }

    if (hasActiveVkCommunity(this.vkConfig)) {
      platforms.push('vk');
    }

    return platforms;
  }
}

export const crossPosterService = new CrossPosterService({ platforms: [] });
