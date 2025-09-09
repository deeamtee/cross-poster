import type { VKConfig, PostDraft, PostResult } from '../../types';

export const vkApi = {
  async publishPost(config: VKConfig, post: PostDraft): Promise<PostResult> {
    try {
      const ownerId = config.groupId 
        ? `-${config.groupId}` 
        : config.userId || '';

      if (!ownerId) {
        return {
          platform: 'vk',
          success: false,
          error: 'No group ID or user ID specified',
        };
      }

      const url = 'https://api.vk.com/method/wall.post';
      
      const params = new URLSearchParams({
        access_token: config.accessToken,
        v: '5.131',
        owner_id: ownerId,
        message: post.content,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      const data = await response.json();

      if (data.response) {
        return {
          platform: 'vk',
          success: true,
          messageId: data.response.post_id.toString(),
        };
      } else if (data.error) {
        return {
          platform: 'vk',
          success: false,
          error: `${data.error.error_msg} (${data.error.error_code})`,
        };
      } else {
        return {
          platform: 'vk',
          success: false,
          error: 'Unknown error',
        };
      }
    } catch (error) {
      return {
        platform: 'vk',
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  async publishPostWithImages(config: VKConfig, post: PostDraft): Promise<PostResult> {
    try {
      if (!post.images || post.images.length === 0) {
        return this.publishPost(config, post);
      }

      return {
        platform: 'vk',
        success: false,
        error: 'Image posting to VK not implemented in this MVP. Please use text-only posts.',
      };
    } catch (error) {
      return {
        platform: 'vk',
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
};