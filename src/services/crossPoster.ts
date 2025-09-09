import { TelegramService } from './telegram';
import { VKService } from './vk';
import type { AppConfig, PostDraft, PublishResponse, PostResult, TelegramConfig, VKConfig } from '../types';

export class CrossPosterService {
  private telegramService?: TelegramService;
  private vkService?: VKService;

  constructor(config: AppConfig) {
    this.updateConfig(config);
  }

  updateConfig(config: AppConfig) {
    config.platforms.forEach(platformConfig => {
      if (!platformConfig.enabled) return;

      switch (platformConfig.platform) {
        case 'telegram':
          this.telegramService = new TelegramService(platformConfig.config as TelegramConfig);
          break;
        case 'vk':
          this.vkService = new VKService(platformConfig.config as VKConfig);
          break;
      }
    });
  }

  async publishPost(post: PostDraft): Promise<PublishResponse> {
    const results: PostResult[] = [];
    
    // Publish to Telegram if configured
    if (this.telegramService) {
      const result = post.images && post.images.length > 0
        ? await this.telegramService.publishPostWithImages(post)
        : await this.telegramService.publishPost(post);
      results.push(result);
    }

    // Publish to VK if configured
    if (this.vkService) {
      const result = post.images && post.images.length > 0
        ? await this.vkService.publishPostWithImages(post)
        : await this.vkService.publishPost(post);
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
    if (this.telegramService) platforms.push('Telegram');
    if (this.vkService) platforms.push('VK');
    return platforms;
  }
}