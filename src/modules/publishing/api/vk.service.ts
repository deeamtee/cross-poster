import type { PostDraft, PostResult, VKConfig, VKCommunityToken } from "@types";
import { mergeVkConfigWithStoredToken, saveVkTokenFromConfig } from "../lib";
import { authService } from "@modules/auth";

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
      throw new Error("Authentication token missing");
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    if (options?.json !== false) {
      headers["Content-Type"] = "application/json";
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

  private resolveTargets(): { ready: TargetCommunity[]; issues: PostResult[] } {
    this.syncConfigWithStorage();

    const communities = this.config.communities ?? [];
    const ready: TargetCommunity[] = [];
    const issues: PostResult[] = [];

    for (const community of communities) {
      if (!community.isSelected) {
        continue;
      }

      const displayName = community.name ?? `Group ${community.groupId}`;

      if (!community.accessToken) {
        issues.push({
          platform: "vk",
          success: false,
          error: `Community ${displayName} is not authorized.`,
        });
        continue;
      }

      if (this.isCommunityTokenExpired(community)) {
        issues.push({
          platform: "vk",
          success: false,
          error: `Community ${displayName} token has expired.`,
        });
        continue;
      }

      const ownerId = Number(community.ownerId ?? `-${community.groupId}`);
      if (!Number.isFinite(ownerId) || ownerId === 0) {
        issues.push({
          platform: "vk",
          success: false,
          error: `Community ${displayName} has an invalid owner id.`,
        });
        continue;
      }

      ready.push({
        ownerId,
        accessToken: community.accessToken,
        community,
      });
    }

    if (!ready.length && !issues.length) {
      issues.push({
        platform: "vk",
        success: false,
        error: "No VK communities selected for publishing.",
      });
    }

    return { ready, issues };
  }

  private async prepareAttachments(post: PostDraft, ownerId: number): Promise<string[]> {
    if (!post.images?.length) {
      return [];
    }

    const uploads = post.images.map((photo) => this.uploadPhoto(photo, ownerId));
    return Promise.all(uploads);
  }

  private async uploadPhoto(photo: File, ownerId: number): Promise<string> {
    const userAccessToken = this.config.accessToken?.trim();
    if (!userAccessToken) {
      throw new Error("VK ID user token is missing. Please sign in with VK ID to upload images.");
    }

    const formData = new FormData();
    formData.append("photo", photo, photo.name);
    formData.append("access_token", userAccessToken);
    formData.append("owner_id", ownerId.toString());

    const response = await fetch(`${this.API_BASE_URL}/vk/uploadPhoto`, {
      method: "POST",
      headers: this.getAuthHeaders({ json: false }),
      body: formData,
    });

    const data = await response.json();

    if (!data.success || !data.data?.attachment) {
      throw new Error(data.error?.message ?? "VK API returned an error during photo upload.");
    }

    return data.data.attachment as string;
  }

  private async publishToCommunity(post: PostDraft, target: TargetCommunity): Promise<PostResult> {
    const { ownerId, accessToken, community } = target;
    const displayName = community.name ?? `Group ${community.groupId}`;

    try {
      const attachments = await this.prepareAttachments(post, ownerId);

      const body: Record<string, unknown> = {
        access_token: accessToken,
        owner_id: ownerId,
        message: post.content,
      };

      if (attachments.length > 0) {
        body.attachments = attachments;
      }

      const response = await fetch(`${this.API_BASE_URL}/vk/post`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        const postId = data.data?.post_id;
        return {
          platform: "vk",
          success: true,
          messageId: typeof postId !== "undefined" ? `${ownerId}_${postId}` : ownerId.toString(),
        };
      }

      return {
        platform: "vk",
        success: false,
        error: `[${displayName}] ${data.error?.message ?? "VK API returned an error."}`,
      };
    } catch (error) {
      return {
        platform: "vk",
        success: false,
        error: `[${displayName}] ${error instanceof Error ? error.message : "Network error."}`,
      };
    }
  }

  async publishPost(post: PostDraft): Promise<PostResult[]> {
    const { ready, issues } = this.resolveTargets();

    if (!ready.length) {
      return issues;
    }

    const results: PostResult[] = [...issues];

    for (const target of ready) {
      const result = await this.publishToCommunity(post, target);
      results.push(result);
    }

    return results;
  }
}
