import type { PostDraft, PostResult, VKConfig, VKCommunityToken } from "@types";
import { mergeVkConfigWithStoredToken, saveVkTokenFromConfig } from '../lib';
import { authService } from '@modules/auth';

type TargetCommunity = {
  ownerId: number;
  accessToken: string;
  community: VKCommunityToken;
};

const COMMUNITY_TOKEN_EXPIRATION_BUFFER_MS = 60_000;

export class VKService {
  private config: VKConfig;
  private readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

  constructor(config: VKConfig) {
    this.config = { ...config };
    this.syncConfigWithStorage();
  }

  private syncConfigWithStorage() {
    const merged = mergeVkConfigWithStoredToken(this.config);
    Object.assign(this.config, merged);
    saveVkTokenFromConfig(this.config);
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

  private isCommunityTokenExpired(community: VKCommunityToken): boolean {
    if (!community.accessTokenExpiresAt) {
      return false;
    }

    const expiresAt = Date.parse(community.accessTokenExpiresAt);
    if (!Number.isFinite(expiresAt)) {
      return false;
    }

    return Date.now() >= expiresAt - COMMUNITY_TOKEN_EXPIRATION_BUFFER_MS;
  }

  private evaluateTargets(): { ready: TargetCommunity[]; issues: PostResult[] } {
    this.syncConfigWithStorage();

    const communities = Array.isArray(this.config.communities) ? this.config.communities : [];
    const ready: TargetCommunity[] = [];
    const issues: PostResult[] = [];

    communities.forEach((community) => {
      if (!community.isSelected) {
        return;
      }

      const displayName = community.name || `Group ${community.groupId}`;

      if (!community.accessToken || community.accessToken.length === 0) {
        issues.push({
          platform: 'vk',
          success: false,
          error: `Community ${displayName} is not authorized.`,
        });
        return;
      }

      if (this.isCommunityTokenExpired(community)) {
        issues.push({
          platform: 'vk',
          success: false,
          error: `Community ${displayName} token has expired.`,
        });
        return;
      }

      const ownerId = Number(community.ownerId ?? `-${community.groupId}`);
      if (!Number.isFinite(ownerId) || ownerId === 0) {
        issues.push({
          platform: 'vk',
          success: false,
          error: `Community ${displayName} has an invalid owner id.`,
        });
        return;
      }

      ready.push({
        ownerId,
        accessToken: community.accessToken,
        community,
      });
    });

    if (ready.length === 0 && issues.length === 0) {
      issues.push({
        platform: 'vk',
        success: false,
        error: 'No VK communities selected for publishing.',
      });
    }

    return { ready, issues };
  }

  private async publishToCommunity(post: PostDraft, target: TargetCommunity): Promise<PostResult> {
    const { ownerId, accessToken, community } = target;
    const displayName = community.name || `Group ${community.groupId}`;

    try {
      let attachments: string[] | undefined;

      if (post.images && post.images.length > 0) {
        const uploadResult = await this.uploadPhotos(post.images, ownerId, accessToken);
        if (!uploadResult.success) {
          return {
            platform: 'vk',
            success: false,
            error: `[${displayName}] ${uploadResult.error || 'Failed to upload images to VK.'}`,
          };
        }
        attachments = uploadResult.data;
      }

      const body: Record<string, unknown> = {
        access_token: accessToken,
        owner_id: ownerId,
        message: post.content,
      };

      if (attachments && attachments.length > 0) {
        body.attachments = attachments;
      }

      const response = await fetch(`${this.API_BASE_URL}/vk/post`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        const postId = data.data?.post_id;
        return {
          platform: 'vk',
          success: true,
          messageId: typeof postId !== 'undefined' ? `${ownerId}_${postId}` : ownerId.toString(),
        };
      }

      return {
        platform: 'vk',
        success: false,
        error: `[${displayName}] ${data.error?.message || 'VK API returned an error.'}`,
      };
    } catch (error) {
      return {
        platform: 'vk',
        success: false,
        error: `[${displayName}] ${error instanceof Error ? error.message : 'Network error.'}`,
      };
    }
  }

  private async publishToTargets(post: PostDraft): Promise<PostResult[]> {
    const { ready, issues } = this.evaluateTargets();

    if (ready.length === 0) {
      return issues;
    }

    const results: PostResult[] = [...issues];

    for (const target of ready) {
      const result = await this.publishToCommunity(post, target);
      results.push(result);
    }

    return results;
  }

  async publishPost(post: PostDraft): Promise<PostResult[]> {
    return this.publishToTargets(post);
  }

  async publishPostWithImages(post: PostDraft): Promise<PostResult[]> {
    return this.publishToTargets(post);
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
        formData.append('photo', photo, photo.name);
        formData.append('access_token', accessToken);
        formData.append('owner_id', ownerId.toString());

        const response = await fetch(`${this.API_BASE_URL}/vk/uploadPhoto`, {
          method: 'POST',
          headers: this.getAuthHeaders({ json: false }),
          body: formData,
        });

        const data = await response.json();

        if (!data.success) {
          return {
            success: false,
            error: data.error?.message || 'VK API returned an error during photo upload.',
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
        error: error instanceof Error ? error.message : 'Network error.',
      };
    }
  }
}