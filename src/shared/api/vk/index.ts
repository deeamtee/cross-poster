import type { VKConfig, PostDraft, PostResult } from '../../types';

// VK API response types
interface VKResponse {
  response?: {
    post_id: number;
  };
  error?: {
    error_code: number;
    error_msg: string;
  };
}

// Extend Window interface for JSONP callbacks
declare global {
  interface Window {
    [key: string]: ((response: VKResponse) => void) | undefined;
  }
}

// JSONP utility function for cross-domain VK API requests
function makeJsonpRequest(url: string, params: Record<string, string>): Promise<VKResponse> {
  return new Promise((resolve, reject) => {
    // Generate unique callback name
    const callbackName = `vkCallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create script element
    const script = document.createElement('script');
    
    // Set up callback function
    window[callbackName] = (response: VKResponse) => {
      // Clean up
      delete window[callbackName];
      document.head.removeChild(script);
      resolve(response);
    };
    
    // Set up error handling
    script.onerror = () => {
      delete window[callbackName];
      document.head.removeChild(script);
      reject(new Error('JSONP request failed'));
    };
    
    // Build URL with parameters and callback
    const urlParams = new URLSearchParams(params);
    urlParams.append('callback', callbackName);
    script.src = `${url}?${urlParams.toString()}`;
    
    // Add script to document
    document.head.appendChild(script);
    
    // Set timeout for cleanup
    setTimeout(() => {
      if (window[callbackName]) {
        delete window[callbackName];
        if (script.parentNode) {
          document.head.removeChild(script);
        }
        reject(new Error('JSONP request timeout'));
      }
    }, 30000); // 30 seconds timeout
  });
}

export const vkApi = {
  // Test if current access token is valid
  async testAccessToken(accessToken: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const data = await makeJsonpRequest('https://api.vk.com/method/users.get', {
        access_token: accessToken,
        v: '5.199'
      });

      if (data.response) {
        return { valid: true };
      } else if (data.error) {
        return { 
          valid: false, 
          error: `${data.error.error_msg} (${data.error.error_code})` 
        };
      } else {
        return { valid: false, error: 'Unknown error' };
      }
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  },

  async publishPost(config: VKConfig, post: PostDraft): Promise<PostResult> {
    try {
      // First, test if the access token is valid
      const tokenTest = await this.testAccessToken(config.accessToken);
      if (!tokenTest.valid) {
        return {
          platform: 'vk',
          success: false,
          error: `Invalid access token: ${tokenTest.error}. Please re-authenticate with VK.`,
        };
      }

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
      
      const params: Record<string, string> = {
        access_token: config.accessToken,
        v: '5.199', // Updated to latest API version
        owner_id: ownerId,
        message: post.content,
      };

      // If posting to a group, add from_group parameter
      if (config.groupId) {
        params.from_group = '1';
      }

      const data = await makeJsonpRequest(url, params);

      if (data.response) {
        return {
          platform: 'vk',
          success: true,
          messageId: data.response.post_id.toString(),
        };
      } else if (data.error) {
        // Provide more helpful error messages for common issues
        let errorMessage = `${data.error.error_msg} (${data.error.error_code})`;
        
        if (data.error.error_code === 5) {
          errorMessage = 'Access token is invalid or expired. Please re-authenticate with VK OAuth.';
        } else if (data.error.error_code === 15) {
          errorMessage = 'Access denied: you do not have permission to post to this group.';
        } else if (data.error.error_code === 214) {
          errorMessage = 'Access denied: posting to this group is restricted.';
        }
        
        return {
          platform: 'vk',
          success: false,
          error: errorMessage,
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

      // For future implementation with JSONP:
      // 1. Upload images using photos.getWallUploadServer
      // 2. Save photos using photos.saveWallPhoto  
      // 3. Post with attachments using wall.post
      // All these would need to use JSONP for cross-domain compatibility
      
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