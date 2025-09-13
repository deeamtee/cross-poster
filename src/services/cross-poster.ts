import type { AppConfig, PostDraft, PublishResponse, PostResult, TelegramConfig, VKConfig } from '../core/types';
import { TelegramService } from './telegram';
import { VKService } from './vk';

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
    // Update config before publishing
    this.updateConfig(config);
    
    const results: PostResult[] = [];
    
    // Publish to Telegram if configured
    if (this.telegramConfig) {
      const telegramService = new TelegramService(this.telegramConfig);
      const result = post.images && post.images.length > 0
        ? await telegramService.publishPostWithImages(post)
        : await telegramService.publishPost(post);
      results.push(result);
    }

    // Publish to VK if configured
    if (this.vkConfig) {
      const vkService = new VKService(this.vkConfig);
      const result = post.images && post.images.length > 0
        ? await vkService.publishPostWithImages(post)
        : await vkService.publishPost(post);
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

// Export a singleton instance
export const crossPosterService = new CrossPosterService({ platforms: [] });