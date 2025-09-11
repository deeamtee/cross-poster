import { telegramApi } from './telegram';
import type { AppConfig, PostDraft, PublishResponse, PostResult, TelegramConfig } from '../core/types';

export class CrossPosterService {
  private telegramConfig?: TelegramConfig;

  constructor(config: AppConfig) {
    this.updateConfig(config);
  }

  updateConfig(config: AppConfig) {
    // Reset configs
    this.telegramConfig = undefined;

    config.platforms.forEach(platformConfig => {
      if (!platformConfig.enabled) return;

      switch (platformConfig.platform) {
        case 'telegram':
          this.telegramConfig = platformConfig.config as TelegramConfig;
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
      const result = post.images && post.images.length > 0
        ? await telegramApi.publishPostWithImages(this.telegramConfig, post)
        : await telegramApi.publishPost(this.telegramConfig, post);
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
    return platforms;
  }
}

// Export a singleton instance
export const crossPosterService = new CrossPosterService({ platforms: [] });