import type { TelegramConfig, PostDraft, PostResult } from '../../types';

export const telegramApi = {
  async publishPost(config: TelegramConfig, post: PostDraft): Promise<PostResult> {
    try {
      const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: config.chatId,
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
  },

  async publishPostWithImages(config: TelegramConfig, post: PostDraft): Promise<PostResult> {
    try {
      if (!post.images || post.images.length === 0) {
        return this.publishPost(config, post);
      }

      if (post.images.length === 1) {
        return this.sendSinglePhoto(config, post.images[0], post.content);
      } else {
        return this.sendMultiplePhotos(config, post.images, post.content);
      }
    } catch (error) {
      return {
        platform: 'telegram',
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  async sendSinglePhoto(config: TelegramConfig, photo: File, caption: string): Promise<PostResult> {
    try {
      const url = `https://api.telegram.org/bot${config.botToken}/sendPhoto`;
      
      const formData = new FormData();
      formData.append('chat_id', config.chatId);
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
  },

  async sendMultiplePhotos(config: TelegramConfig, photos: File[], caption: string): Promise<PostResult> {
    try {
      const media = photos.map((_, index) => ({
        type: 'photo' as const,
        media: `attach://photo${index}`,
        caption: index === 0 ? caption : undefined,
        parse_mode: index === 0 ? 'HTML' as const : undefined
      }));

      const url = `https://api.telegram.org/bot${config.botToken}/sendMediaGroup`;
      
      const formData = new FormData();
      formData.append('chat_id', config.chatId);
      formData.append('media', JSON.stringify(media));
      
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
};