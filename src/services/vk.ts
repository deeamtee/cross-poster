import type { VKConfig, PostDraft, PostResult } from '../types';

// VK API service
export class VKService {
  private config: VKConfig;

  constructor(config: VKConfig) {
    this.config = config;
  }

  async publishPost(post: PostDraft): Promise<PostResult> {
    try {
      // Determine owner_id: negative for groups, positive for users
      const ownerId = this.config.groupId 
        ? `-${this.config.groupId}` 
        : this.config.userId || '';

      if (!ownerId) {
        return {
          platform: 'vk',
          success: false,
          error: 'No group ID or user ID specified',
        };
      }

      const url = 'https://api.vk.com/method/wall.post';
      
      const params = new URLSearchParams({
        access_token: this.config.accessToken,
        v: '5.131', // VK API version
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
  }

  async publishPostWithImages(post: PostDraft): Promise<PostResult> {
    try {
      if (!post.images || post.images.length === 0) {
        return this.publishPost(post);
      }

      // For VK, we need to upload images first, then post with attachments
      // This is a simplified version - in a real app, you'd need to implement image upload
      // For now, we'll just post the text and note that images aren't supported yet
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
}