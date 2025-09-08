import type { TelegramConfig, PostDraft, PostResult } from '../types';

// Telegram API service
export class TelegramService {
  private config: TelegramConfig;

  constructor(config: TelegramConfig) {
    this.config = config;
  }

  async publishPost(post: PostDraft): Promise<PostResult> {
    try {
      const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text: post.content,
          parse_mode: 'HTML'
        }),
      });

      const data = await response.json();

      if (data.ok) {
        return {
          platform: 'telegram',
          success: true,
          messageId: data.result.message_id.toString(),
        };
      } else {
        return {
          platform: 'telegram',
          success: false,
          error: data.description || 'Unknown error',
        };
      }
    } catch (error) {
      return {
        platform: 'telegram',
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async publishPostWithImages(post: PostDraft): Promise<PostResult> {
    try {
      if (!post.images || post.images.length === 0) {
        return this.publishPost(post);
      }

      // For images, use sendPhoto for single image or sendMediaGroup for multiple
      if (post.images.length === 1) {
        const url = `https://api.telegram.org/bot${this.config.botToken}/sendPhoto`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: this.config.chatId,
            photo: post.images[0],
            caption: post.content,
            parse_mode: 'HTML'
          }),
        });

        const data = await response.json();

        if (data.ok) {
          return {
            platform: 'telegram',
            success: true,
            messageId: data.result.message_id.toString(),
          };
        } else {
          return {
            platform: 'telegram',
            success: false,
            error: data.description || 'Unknown error',
          };
        }
      } else {
        // Multiple images - use sendMediaGroup
        const media = post.images.map((image, index) => ({
          type: 'photo',
          media: image,
          caption: index === 0 ? post.content : undefined,
          parse_mode: index === 0 ? 'HTML' : undefined
        }));

        const url = `https://api.telegram.org/bot${this.config.botToken}/sendMediaGroup`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: this.config.chatId,
            media: media,
          }),
        });

        const data = await response.json();

        if (data.ok) {
          return {
            platform: 'telegram',
            success: true,
            messageId: data.result[0]?.message_id?.toString(),
          };
        } else {
          return {
            platform: 'telegram',
            success: false,
            error: data.description || 'Unknown error',
          };
        }
      }
    } catch (error) {
      return {
        platform: 'telegram',
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
}