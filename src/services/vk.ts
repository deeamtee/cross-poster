import type { PostDraft, PostResult, VKConfig } from "@/core/types";
import {
  mergeVkConfigWithStoredToken,
  saveVkTokenFromConfig,
  isVkTokenExpired,
  refreshVkToken,
} from "@/services/vk-token.storage";

export class VKService {
  private config: VKConfig;
  private readonly API_BASE_URL = "http://localhost:3000/api";
  private readonly API_KEY = "secret-api-key";

  constructor(config: VKConfig) {
    this.config = { ...config };
    this.syncConfigWithStorage();
  }

  private syncConfigWithStorage() {
    const merged = mergeVkConfigWithStoredToken(this.config);
    Object.assign(this.config, merged);
    if (this.config.accessToken) {
      saveVkTokenFromConfig(this.config);
    }
  }

  private async ensureAccessToken(): Promise<{ ownerId: number; accessToken: string } | { error: string }> {
    this.syncConfigWithStorage();

    if (!this.config.accessToken) {
      return { error: "VK access token is missing. ���ਧ���� �१ VK ID." };
    }

    if (isVkTokenExpired(this.config)) {
      const refreshed = await refreshVkToken(this.config);
      if (refreshed?.accessToken) {
        Object.assign(this.config, refreshed);
      } else {
        return { error: "VK access token ����. ������ ���ਧ��� через VK ID." };
      }
    }

    const ownerId = Number(this.config.ownerId);
    if (Number.isNaN(ownerId)) {
      return { error: "������ ownerId ��� VK. ������ ���४�� ID �⥭�." };
    }

    saveVkTokenFromConfig(this.config);
    return { ownerId, accessToken: this.config.accessToken };
  }

  async publishPost(post: PostDraft): Promise<PostResult> {
    const validation = await this.ensureAccessToken();
    if ("error" in validation) {
      return {
        platform: "vk",
        success: false,
        error: validation.error,
      };
    }

    const { ownerId, accessToken } = validation;

    try {
      const url = `${this.API_BASE_URL}/vk/post`;

      const requestBody: Record<string, unknown> = {
        access_token: accessToken,
        owner_id: ownerId,
        message: post.content,
      };

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
      }

      return {
        platform: "vk",
        success: false,
        error: data.error?.message || "VK API ���� �訡��",
      };
    } catch (error) {
      return {
        platform: "vk",
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async publishPostWithImages(post: PostDraft): Promise<PostResult> {
    const validation = await this.ensureAccessToken();
    if ("error" in validation) {
      return {
        platform: "vk",
        success: false,
        error: validation.error,
      };
    }

    const { ownerId, accessToken } = validation;

    try {
      if (!post.images || post.images.length === 0) {
        return this.publishPost(post);
      }

      const attachments = await this.uploadPhotos(post.images, ownerId, accessToken);
      if (!attachments.success) {
        return {
          platform: "vk",
          success: false,
          error: attachments.error || "�� 㤠���� ����㧨�� �� � VK",
        };
      }

      const url = `${this.API_BASE_URL}/vk/post`;

      const requestBody: Record<string, unknown> = {
        access_token: accessToken,
        owner_id: ownerId,
        message: post.content,
        attachments: attachments.data,
      };

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
      }

      return {
        platform: "vk",
        success: false,
        error: data.error?.message || "VK API ���� �訡��",
      };
    } catch (error) {
      return {
        platform: "vk",
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  private async uploadPhotos(
    photos: File[],
    ownerId: number,
    accessToken: string
  ): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
      const attachmentIds: string[] = [];

      for (const photo of photos) {
        const formData = new FormData();
        formData.append("photo", photo, photo.name);
        formData.append("access_token", accessToken);
        formData.append("owner_id", ownerId.toString());

        const response = await fetch(`${this.API_BASE_URL}/vk/uploadPhoto`, {
          method: "POST",
          headers: {
            "x-api-key": this.API_KEY,
          },
          body: formData,
        });

        const data = await response.json();

        if (!data.success) {
          return {
            success: false,
            error: data.error?.message || "VK API ���� �訡�� �� ����㧪� ��",
          };
        }

        if (data.data?.attachment) {
          attachmentIds.push(data.data.attachment as string);
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
