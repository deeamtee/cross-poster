import type { AppConfig, PostDraft, PublishResponse, PostResult, TelegramConfig } from '../core/types';
import { TelegramService } from './telegram';

export class CrossPosterService {
  private telegramConfig?: TelegramConfig;

  constructor(config: AppConfig) {
    this.updateConfig(config);
  }

  updateConfig(config: AppConfig) {
    // Reset configs
    this.telegramConfig = undefined;

    console.log('Updating cross-poster config:', config);

    config.platforms.forEach(platformConfig => {
      if (!platformConfig.enabled) {
        console.log('Platform not enabled, skipping:', platformConfig.platform);
        return;
      }

      switch (platformConfig.platform) {
        case 'telegram':
          console.log('Telegram config found:', platformConfig.config);
          this.telegramConfig = platformConfig.config as TelegramConfig;
          break;
      }
    });
  }

  async publishPost(post: PostDraft, config: AppConfig): Promise<PublishResponse> {
    console.log('Publishing post with config:', { post, config });
    
    // Update config before publishing
    this.updateConfig(config);
    
    const results: PostResult[] = [];
    
    // Publish to Telegram if configured
    if (this.telegramConfig) {
      console.log('Publishing to Telegram with config:', this.telegramConfig);
      const telegramService = new TelegramService(this.telegramConfig);
      const result = post.images && post.images.length > 0
        ? await telegramService.publishPostWithImages(post)
        : await telegramService.publishPost(post);
      results.push(result);
    } else {
      console.log('No Telegram config found, skipping Telegram publishing');
      console.log('Current config state:', config);
    }

    const totalSuccess = results.filter(r => r.success).length;
    const totalFailure = results.filter(r => !r.success).length;

    console.log('Publish results:', { results, totalSuccess, totalFailure });

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