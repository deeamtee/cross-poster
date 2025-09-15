import type { PostDraft, PostResult, VKConfig } from "@/core/types";

export class VKService {
  private config: VKConfig;
  private readonly API_BASE_URL = "http://localhost:3000/api";
  private readonly API_KEY = "secret-api-key";

  constructor(config: VKConfig) {
    this.config = config;
  }

  // Health check endpoint
  async healthCheck(): Promise<{
    success: boolean;
    data?: { status: string; timestamp: string; uptime: number };
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/health`, {
        method: "GET",
      });

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Health check failed",
      };
    }
  }

  async publishPost(post: PostDraft): Promise<PostResult> {
    try {
      const url = `${this.API_BASE_URL}/vk/post`;

      const requestBody: {
        owner_id: number;
        message: string;
        from_group?: number;
      } = {
        // Fix: Provide a default value in case groupId is not a valid number
        owner_id: parseInt(this.config.groupId),
        message: post.content,
      };

      // Add optional parameters
      if (this.config.groupId) {
        requestBody.from_group = 1;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.API_KEY,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        return {
          platform: "vk",
          success: true,
          messageId: data.data?.post_id?.toString(),
        };
      } else {
        return {
          platform: "vk",
          success: false,
          error: data.error?.message || "Unknown error",
        };
      }
    } catch (error) {
      return {
        platform: "vk",
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async publishPostWithImages(post: PostDraft): Promise<PostResult> {
    try {
      if (!post.images || post.images.length === 0) {
        return this.publishPost(post);
      }

      // First, upload photos to get attachment strings
      const attachments = await this.uploadPhotos(post.images);
      if (!attachments.success) {
        return {
          platform: "vk",
          success: false,
          error: attachments.error || "Failed to upload photos",
        };
      }

      // Then create the post with attachments
      const url = `${this.API_BASE_URL}/vk/post`;

      const requestBody: {
        owner_id: number;
        message: string;
        attachments: string;
        from_group?: number;
      } = {
        owner_id: this.config.groupId ? parseInt(this.config.groupId, 10) : 0,
        message: post.content,
        attachments: attachments.data ? attachments.data.join(",") : "",
      };

      // Add optional parameters
      if (this.config.groupId) {
        requestBody.from_group = 1;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.API_KEY,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        return {
          platform: "vk",
          success: true,
          messageId: data.data?.post_id?.toString(),
        };
      } else {
        return {
          platform: "vk",
          success: false,
          error: data.error?.message || "Unknown error",
        };
      }
    } catch (error) {
      return {
        platform: "vk",
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  private async uploadPhotos(photos: File[]): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
      const attachmentIds: string[] = [];

      // Upload each photo
      for (const photo of photos) {
        const formData = new FormData();
        formData.append("photo", photo, photo.name);

        const response = await fetch(`${this.API_BASE_URL}/vk/uploadPhoto`, {
          method: "POST",
          headers: {
            "x-api-key": this.API_KEY,
          },
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          if (data.data?.attachment) {
            attachmentIds.push(data.data.attachment);
          }
        } else {
          return {
            success: false,
            error: data.error?.message || "Failed to upload photo",
          };
        }
      }

      return {
        success: true,
        data: attachmentIds,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }
}
