import type { PostDraft, PostResult, TelegramConfig } from "@/core/types";

export class TelegramService {
  private config: TelegramConfig;

  constructor(config: TelegramConfig) {
    this.config = config;
  }

  async publishPost(post: PostDraft): Promise<PostResult> {
    try {
      // First validate the bot token
      const tokenValidation = await this.validateBotToken();
      if (!tokenValidation.valid) {
        return {
          platform: 'telegram',
          success: false,
          error: tokenValidation.error || 'Invalid bot token',
        };
      }

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

      // First validate the bot token
      const tokenValidation = await this.validateBotToken();
      if (!tokenValidation.valid) {
        return {
          platform: 'telegram',
          success: false,
          error: tokenValidation.error || 'Invalid bot token',
        };
      }

      // For images, use sendPhoto for single image or sendMediaGroup for multiple
      if (post.images.length === 1) {
        return await this.sendSinglePhoto(post.images[0], post.content);
      } else {
        return await this.sendMultiplePhotos(post.images, post.content);
      }
    } catch (error) {
      return {
        platform: 'telegram',
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  private async validateBotToken(): Promise<{ valid: boolean; error?: string }> {
    try {
      // Remove any whitespace from the token
      const cleanToken = this.config.botToken.trim();
      
      // Check if token has the expected format (numbers:letters)
      if (!cleanToken || !/^\d+:[\w-]+$/.test(cleanToken)) {
        return {
          valid: false,
          error: 'Invalid bot token format. Expected format: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ',
        };
      }

      // Test the token with getMe endpoint
      const url = `https://api.telegram.org/bot${cleanToken}/getMe`;
      const response = await fetch(url, {
        method: 'GET',
      });

      if (response.status === 401) {
        return {
          valid: false,
          error: 'Invalid bot token. Please check your token and try again.',
        };
      }

      const data = await response.json();
      
      if (data.ok) {
        return { valid: true };
      } else {
        return {
          valid: false,
          error: data.description || 'Invalid bot token',
        };
      }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Failed to validate bot token',
      };
    }
  }

  private async sendSinglePhoto(photo: File, caption: string): Promise<PostResult> {
    try {
      const url = `https://api.telegram.org/bot${this.config.botToken}/sendPhoto`;

      const formData = new FormData();
      formData.append('chat_id', this.config.chatId);
      formData.append('photo', photo, photo.name);
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
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

  private async sendMultiplePhotos(photos: File[], caption: string): Promise<PostResult> {
    try {
      // For multiple photos, we can send them directly using multipart form data
      // Create media array with attach:// references
      const media = photos.map((photo, index) => ({
        type: 'photo' as const,
        media: `attach://photo${index}`,
        caption: index === 0 ? caption : undefined,
        parse_mode: index === 0 ? 'HTML' as const : undefined
      }));

      const url = `https://api.telegram.org/bot${this.config.botToken}/sendMediaGroup`;

      // Create FormData and attach files
      const formData = new FormData();
      formData.append('chat_id', this.config.chatId);
      formData.append('media', JSON.stringify(media));

      // Attach each photo file
      photos.forEach((photo, index) => {
        formData.append(`photo${index}`, photo, photo.name);
      });

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
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
    } catch (error) {
      return {
        platform: 'telegram',
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
}