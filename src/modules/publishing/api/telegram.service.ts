import type { PostDraft, PostResult, TelegramConfig } from "@types";
import { authService } from "@modules/auth";

export class TelegramService {
  private config: TelegramConfig;
  private readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

  constructor(config: TelegramConfig) {
    this.config = config;
  }

  private getAuthHeaders(options?: { json?: boolean }): HeadersInit {
    const token = authService.getAccessToken();
    if (!token) {
      throw new Error('Authentication token missing');
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    if (options?.json !== false) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  async healthCheck(): Promise<{ success: boolean; data?: { status: string; timestamp: string; uptime: number }; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/health`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        return {
          success: false,
          error: payload?.error?.message || 'Health check failed',
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  }

  async publishPost(post: PostDraft): Promise<PostResult> {
    try {
      const url = `${this.API_BASE_URL}/telegram/sendMessage`;

      const requestBody = {
        chat_id: this.config.chatId,
        text: post.content,
        parse_mode: 'HTML',
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        return {
          platform: 'telegram',
          success: true,
          messageId: data.data?.message_id?.toString(),
        };
      }

      return {
        platform: 'telegram',
        success: false,
        error: data.error?.message || 'Unknown error',
      };
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

      if (post.images.length === 1) {
        return await this.sendSinglePhoto(post.images[0], post.content);
      }

      return await this.sendMultiplePhotos(post.images, post.content);
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

      const formData = new FormData();
      formData.append('chat_id', this.config.chatId);
      formData.append('photo', photo);
      if (caption) {
        formData.append('caption', caption);
      }
      formData.append('parse_mode', 'HTML');

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders({ json: false }),
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        return {
          platform: 'telegram',
          success: true,
          messageId: data.data?.message_id?.toString(),
        };
      }

      return {
        platform: 'telegram',
        success: false,
        error: data.error?.message || 'Unknown error',
      };
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

      const formData = new FormData();
      formData.append('chat_id', this.config.chatId);

      const media = photos.map((_, index) => ({
        type: 'photo',
        media: `attach://photo${index}`,
        caption: index === 0 ? caption : undefined,
        parse_mode: index === 0 ? 'HTML' : undefined,
      }));

      formData.append('media', JSON.stringify(media));

      photos.forEach((photo, index) => {
        formData.append(`photo${index}`, photo);
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders({ json: false }),
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        return {
          platform: 'telegram',
          success: true,
          messageId: data.data?.[0]?.message_id?.toString(),
        };
      }

      return {
        platform: 'telegram',
        success: false,
        error: data.error?.message || 'Unknown error',
      };
    } catch (error) {
      return {
        platform: 'telegram',
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
}
