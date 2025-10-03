import type { PostDraft, PostResult, TelegramConfig } from "@types";
import { authService } from "@modules/auth";

type TargetChannel = {
  chatId: string;
  label?: string;
};

export class TelegramService {
  private config: TelegramConfig;
  private readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

  constructor(config: TelegramConfig) {
    this.config = config;
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

  private resolveTargets(): { ready: TargetChannel[]; issues: PostResult[] } {
    const channels = Array.isArray(this.config.channels) ? this.config.channels : [];
    const ready: TargetChannel[] = [];
    const issues: PostResult[] = [];

    for (const channel of channels) {
      if (!channel.isSelected) {
        continue;
      }

      const chatId = channel.chatId?.trim();
      if (!chatId) {
        issues.push({
          platform: "telegram",
          success: false,
          error: `${channel.label ? `[${channel.label}]` : "Selected channel"} is missing a chat ID.`,
        });
        continue;
      }

      ready.push({
        chatId,
        label: channel.label?.trim() || undefined,
      });
    }

    if (!ready.length && !issues.length) {
      issues.push({
        platform: "telegram",
        success: false,
        error: "No Telegram channels selected for publishing.",
      });
    }

    return { ready, issues };
  }

  private getChannelPrefix(target: TargetChannel): string {
    return target.label ? `[${target.label}]` : `[${target.chatId}]`;
  }

  async healthCheck(): Promise<{ success: boolean; data?: { status: string; timestamp: string; uptime: number }; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/health`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        return {
          success: false,
          error: payload?.error?.message || "Health check failed",
        };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Health check failed",
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
      const result = await this.publishToChannel(target, post);
      results.push(result);
    }

    return results;
  }

  async publishPostWithImages(post: PostDraft): Promise<PostResult[]> {
    return this.publishPost(post);
  }

  private async publishToChannel(target: TargetChannel, post: PostDraft): Promise<PostResult> {
    try {
      if (post.images && post.images.length > 0) {
        if (post.images.length === 1) {
          return await this.sendSinglePhoto(target, post.images[0], post.content);
        }

        return await this.sendMultiplePhotos(target, post.images, post.content);
      }

      return await this.sendMessage(target, post.content);
    } catch (error) {
      return {
        platform: "telegram",
        success: false,
        error: `${this.getChannelPrefix(target)} ${error instanceof Error ? error.message : "Network error"}`,
      };
    }
  }

  private async sendMessage(target: TargetChannel, text: string): Promise<PostResult> {
    const response = await fetch(`${this.API_BASE_URL}/telegram/sendMessage`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        chat_id: target.chatId,
        text,
        parse_mode: "HTML",
      }),
    });

    const data = await response.json();

    if (data.success) {
      const messageId = data.data?.message_id;
      return {
        platform: "telegram",
        success: true,
        messageId: `${this.getChannelPrefix(target)} ${messageId ?? "sent"}`.trim(),
      };
    }

    return {
      platform: "telegram",
      success: false,
      error: `${this.getChannelPrefix(target)} ${data.error?.message || "Unknown error"}`,
    };
  }

  private async sendSinglePhoto(target: TargetChannel, photo: File, caption: string): Promise<PostResult> {
    const formData = new FormData();
    formData.append("chat_id", target.chatId);
    formData.append("photo", photo);

    if (caption) {
      formData.append("caption", caption);
    }

    formData.append("parse_mode", "HTML");

    const response = await fetch(`${this.API_BASE_URL}/telegram/sendPhoto`, {
      method: "POST",
      headers: this.getAuthHeaders({ json: false }),
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      const messageId = data.data?.message_id;
      return {
        platform: "telegram",
        success: true,
        messageId: `${this.getChannelPrefix(target)} ${messageId ?? "photo-sent"}`.trim(),
      };
    }

    return {
      platform: "telegram",
      success: false,
      error: `${this.getChannelPrefix(target)} ${data.error?.message || "Unknown error"}`,
    };
  }

  private async sendMultiplePhotos(target: TargetChannel, photos: File[], caption: string): Promise<PostResult> {
    const formData = new FormData();
    formData.append("chat_id", target.chatId);

    const media = photos.map((_, index) => ({
      type: "photo",
      media: `attach://photo${index}`,
      caption: index === 0 ? caption : undefined,
      parse_mode: index === 0 ? "HTML" : undefined,
    }));

    formData.append("media", JSON.stringify(media));

    photos.forEach((photo, index) => {
      formData.append(`photo${index}`, photo);
    });

    const response = await fetch(`${this.API_BASE_URL}/telegram/sendMediaGroup`, {
      method: "POST",
      headers: this.getAuthHeaders({ json: false }),
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      const messageId = Array.isArray(data.data) ? data.data[0]?.message_id : undefined;
      return {
        platform: "telegram",
        success: true,
        messageId: `${this.getChannelPrefix(target)} ${messageId ?? "media-group"}`.trim(),
      };
    }

    return {
      platform: "telegram",
      success: false,
      error: `${this.getChannelPrefix(target)} ${data.error?.message || "Unknown error"}`,
    };
  }
}
