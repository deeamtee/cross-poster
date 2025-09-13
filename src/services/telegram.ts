import type { PostDraft, PostResult, TelegramConfig } from "@/core/types";

export class TelegramService {
  private config: TelegramConfig;
  private readonly API_BASE_URL = 'http://localhost:3000/api';
  private readonly API_KEY = 'secret-api-key';

  constructor(config: TelegramConfig) {
    this.config = config;
  }

  // Health check endpoint
  async healthCheck(): Promise<{ success: boolean; data?: { status: string; timestamp: string; uptime: number }; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/healthCheck`, {
        method: 'GET',
      });

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Health check failed' 
      };
    }
  }

  async publishPost(post: PostDraft): Promise<PostResult> {
    try {
      const url = `${this.API_BASE_URL}/telegram/sendMessage`;
      
      const requestBody = {
        chat_id: this.config.chatId,
        text: post.content,
        parse_mode: 'HTML'
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.API_KEY,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        return {
          platform: 'telegram',
          success: true,
          messageId: data.data?.message_id?.toString(),
        };
      } else {
        return {
          platform: 'telegram',
          success: false,
          error: data.error?.message || 'Unknown error',
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

  private async sendSinglePhoto(photo: File, caption: string): Promise<PostResult> {
    try {
      const url = `${this.API_BASE_URL}/telegram/sendPhoto`;

      const requestBody = {
        chat_id: this.config.chatId,
        photo: URL.createObjectURL(photo), // In a real implementation, this would be uploaded to a server and return a URL
        caption: caption,
        parse_mode: 'HTML'
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.API_KEY,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        return {
          platform: 'telegram',
          success: true,
          messageId: data.data?.message_id?.toString(),
        };
      } else {
        return {
          platform: 'telegram',
          success: false,
          error: data.error?.message || 'Unknown error',
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
      const url = `${this.API_BASE_URL}/telegram/sendMediaGroup`;

      // Create media array
      const media = photos.map((photo, index) => ({
        type: 'photo',
        media: URL.createObjectURL(photo), // In a real implementation, this would be uploaded to a server and return a URL
        caption: index === 0 ? caption : undefined,
        parse_mode: index === 0 ? 'HTML' : undefined
      }));

      const requestBody = {
        chat_id: this.config.chatId,
        media: media
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.API_KEY,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        return {
          platform: 'telegram',
          success: true,
          messageId: data.data?.[0]?.message_id?.toString(),
        };
      } else {
        return {
          platform: 'telegram',
          success: false,
          error: data.error?.message || 'Unknown error',
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