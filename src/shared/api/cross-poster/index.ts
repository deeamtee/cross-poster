import { telegramApi, vkApi } from '..';
import type { AppConfig, PostDraft, PublishResponse, PostResult, TelegramConfig, VKConfig } from '../../types';

export class CrossPosterService {
  private telegramConfig?: TelegramConfig;
  private vkConfig?: VKConfig;

  constructor(config: AppConfig) {
    this.updateConfig(config);
  }

  updateConfig(config: AppConfig) {
    // Reset configs
    this.telegramConfig = undefined;
    this.vkConfig = undefined;

    config.platforms.forEach(platformConfig => {
      if (!platformConfig.enabled) return;

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

  async publishPost(post: PostDraft): Promise<PublishResponse> {
    const results: PostResult[] = [];
    
    // Publish to Telegram if configured
    if (this.telegramConfig) {
      const result = post.images && post.images.length > 0
        ? await telegramApi.publishPostWithImages(this.telegramConfig, post)
        : await telegramApi.publishPost(this.telegramConfig, post);
      results.push(result);
    }

    // Publish to VK if configured
    if (this.vkConfig) {
      const result = post.images && post.images.length > 0
        ? await vkApi.publishPostWithImages(this.vkConfig, post)
        : await vkApi.publishPost(this.vkConfig, post);
      results.push(result);
    }

    const totalSuccess = results.filter(r => r.success).length;
    const totalFailure = results.filter(r => !r.success).length;

    return {
      results,
      totalSuccess,
      totalFailure,
    };
  }

  getConfiguredPlatforms(): string[] {
    const platforms = [];
    if (this.telegramConfig) platforms.push('telegram');
    if (this.vkConfig) platforms.push('vk');
    return platforms;
  }
}