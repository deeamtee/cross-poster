import type { TelegramConfig, PostDraft, PostResult } from '../core/types';

export const telegramApi = {
  async publishPost(config: TelegramConfig, post: PostDraft): Promise<PostResult> {
    try {
      // Validate config before making request
      if (!config.botToken) {
        return {
          platform: 'telegram',
          success: false,
          error: 'Bot token is missing. Please configure your Telegram bot token in the settings.',
        };
      }
      
      if (!config.chatId) {
        return {
          platform: 'telegram',
          success: false,
          error: 'Chat ID is missing. Please configure your Telegram chat ID in the settings.',
        };
      }

      // Use the proxy endpoint instead of calling Telegram API directly
      // const url = `/api/telegram/bot${config.botToken}/sendMessage`;
       const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`
      console.log('Sending Telegram request to proxy:', url);
      console.log('Request payload:', {
        chat_id: config.chatId,
        text: post.content,
        parse_mode: 'HTML'
      });
      
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

      console.log('Telegram response status:', response.status);
      console.log('Telegram response headers:', [...response.headers.entries()]);

      // Check if the response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Telegram API HTTP error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        
        // Handle specific error cases
        if (response.status === 401) {
          return {
            platform: 'telegram',
            success: false,
            error: 'Invalid bot token. Please check your Telegram bot token in the settings.',
          };
        }
        
        if (response.status === 400) {
          return {
            platform: 'telegram',
            success: false,
            error: 'Invalid request. Please check your chat ID and try again.',
          };
        }
        
        return {
          platform: 'telegram',
          success: false,
          error: `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
        };
      }

      const data = await response.json();
      console.log('Telegram response data:', data);

      if (data.ok) {
        return {
          platform: 'telegram',
          success: true,
          messageId: data.result.message_id.toString(),
        };
      } else {
        // Handle Telegram API specific errors
        let errorMessage = data.description || 'Unknown error';
        
        if (errorMessage.includes('chat not found')) {
          errorMessage = 'Chat not found. Please check your chat ID and make sure the bot is added to the chat.';
        } else if (errorMessage.includes('bot was blocked')) {
          errorMessage = 'Bot was blocked by the user. Please unblock the bot and try again.';
        } else if (errorMessage.includes('Forbidden')) {
          errorMessage = 'Access forbidden. Please check your bot permissions and chat settings.';
        }
        
        return {
          platform: 'telegram',
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      console.error('Telegram API error:', error);
      // Check if it's a CORS error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          platform: 'telegram',
          success: false,
          error: 'Network error - Failed to connect to Telegram API proxy. Please check your internet connection.',
        };
      }
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
      console.error('Telegram API error with images:', error);
      return {
        platform: 'telegram',
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  async sendSinglePhoto(config: TelegramConfig, photo: File, caption: string): Promise<PostResult> {
    try {
      // Validate config before making request
      if (!config.botToken) {
        return {
          platform: 'telegram',
          success: false,
          error: 'Bot token is missing. Please configure your Telegram bot token in the settings.',
        };
      }
      
      if (!config.chatId) {
        return {
          platform: 'telegram',
          success: false,
          error: 'Chat ID is missing. Please configure your Telegram chat ID in the settings.',
        };
      }

      // Use the proxy endpoint instead of calling Telegram API directly
      const url = `/api/telegram/bot${config.botToken}/sendPhoto`;
      console.log('Sending Telegram photo request to proxy:', url);
      
      const formData = new FormData();
      formData.append('chat_id', config.chatId);
      formData.append('photo', photo, photo.name);
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      console.log('Telegram photo response status:', response.status);
      
      // Check if the response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Telegram API HTTP error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        
        // Handle specific error cases
        if (response.status === 401) {
          return {
            platform: 'telegram',
            success: false,
            error: 'Invalid bot token. Please check your Telegram bot token in the settings.',
          };
        }
        
        if (response.status === 400) {
          return {
            platform: 'telegram',
            success: false,
            error: 'Invalid request. Please check your chat ID and try again.',
          };
        }
        
        return {
          platform: 'telegram',
          success: false,
          error: `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
        };
      }

      const data = await response.json();
      console.log('Telegram photo response data:', data);

      if (data.ok) {
        return {
          platform: 'telegram',
          success: true,
          messageId: data.result.message_id.toString(),
        };
      } else {
        // Handle Telegram API specific errors
        let errorMessage = data.description || 'Unknown error';
        
        if (errorMessage.includes('chat not found')) {
          errorMessage = 'Chat not found. Please check your chat ID and make sure the bot is added to the chat.';
        } else if (errorMessage.includes('bot was blocked')) {
          errorMessage = 'Bot was blocked by the user. Please unblock the bot and try again.';
        } else if (errorMessage.includes('Forbidden')) {
          errorMessage = 'Access forbidden. Please check your bot permissions and chat settings.';
        }
        
        return {
          platform: 'telegram',
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      console.error('Telegram photo API error:', error);
      return {
        platform: 'telegram',
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  async sendMultiplePhotos(config: TelegramConfig, photos: File[], caption: string): Promise<PostResult> {
    try {
      // Validate config before making request
      if (!config.botToken) {
        return {
          platform: 'telegram',
          success: false,
          error: 'Bot token is missing. Please configure your Telegram bot token in the settings.',
        };
      }
      
      if (!config.chatId) {
        return {
          platform: 'telegram',
          success: false,
          error: 'Chat ID is missing. Please configure your Telegram chat ID in the settings.',
        };
      }

      const media = photos.map((_, index) => ({
        type: 'photo' as const,
        media: `attach://photo${index}`,
        caption: index === 0 ? caption : undefined,
        parse_mode: index === 0 ? 'HTML' as const : undefined
      }));

      // Use the proxy endpoint instead of calling Telegram API directly
      const url = `/api/telegram/bot${config.botToken}/sendMediaGroup`;
      console.log('Sending Telegram media group request to proxy:', url);
      
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

      console.log('Telegram media group response status:', response.status);
      
      // Check if the response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Telegram API HTTP error:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText
        });
        
        // Handle specific error cases
        if (response.status === 401) {
          return {
            platform: 'telegram',
            success: false,
            error: 'Invalid bot token. Please check your Telegram bot token in the settings.',
          };
        }
        
        if (response.status === 400) {
          return {
            platform: 'telegram',
            success: false,
            error: 'Invalid request. Please check your chat ID and try again.',
          };
        }
        
        return {
          platform: 'telegram',
          success: false,
          error: `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
        };
      }

      const data = await response.json();
      console.log('Telegram media group response data:', data);

      if (data.ok) {
        return {
          platform: 'telegram',
          success: true,
          messageId: data.result[0]?.message_id?.toString(),
        };
      } else {
        // Handle Telegram API specific errors
        let errorMessage = data.description || 'Unknown error';
        
        if (errorMessage.includes('chat not found')) {
          errorMessage = 'Chat not found. Please check your chat ID and make sure the bot is added to the chat.';
        } else if (errorMessage.includes('bot was blocked')) {
          errorMessage = 'Bot was blocked by the user. Please unblock the bot and try again.';
        } else if (errorMessage.includes('Forbidden')) {
          errorMessage = 'Access forbidden. Please check your bot permissions and chat settings.';
        }
        
        return {
          platform: 'telegram',
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      console.error('Telegram media group API error:', error);
      return {
        platform: 'telegram',
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
};