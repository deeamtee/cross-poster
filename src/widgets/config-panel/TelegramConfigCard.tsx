import React, { useMemo } from "react";
import { Card } from "@/ui/card";
import type { TelegramConfig, TelegramChannel } from "@types";

interface TelegramConfigCardProps {
  enabled: boolean;
  config: TelegramConfig;
  onToggle: (enabled: boolean) => void;
  onConfigChange: (config: TelegramConfig) => void;
}

const createEmptyChannel = (): TelegramChannel => ({
  chatId: "",
  isSelected: true,
});

export const TelegramConfigCard: React.FC<TelegramConfigCardProps> = ({
  enabled,
  config,
  onToggle,
  onConfigChange,
}) => {
  const channels = useMemo(() => {
    if (Array.isArray(config.channels) && config.channels.length > 0) {
      return config.channels;
    }

    return [createEmptyChannel()];
  }, [config.channels]);

  const updateChannels = (nextChannels: TelegramChannel[]) => {
    const normalized = nextChannels.length > 0 ? nextChannels : [createEmptyChannel()];
    onConfigChange({ ...config, channels: normalized });
  };

  const handleTokenChange = (value: string) => {
    onConfigChange({ ...config, botToken: value });
  };

  const handleChannelChange = (index: number, patch: Partial<TelegramChannel>) => {
    const currentChannels = Array.isArray(config.channels) && config.channels.length > 0 ? config.channels : channels;
    const nextChannels = currentChannels.map((channel, channelIndex) =>
      channelIndex === index ? { ...channel, ...patch } : channel,
    );
    updateChannels(nextChannels);
  };

  const handleToggleChannel = (index: number, selected: boolean) => {
    handleChannelChange(index, { isSelected: selected });
  };

  const handleChannelIdChange = (index: number, value: string) => {
    handleChannelChange(index, { chatId: value });
  };

  const handleChannelLabelChange = (index: number, value: string) => {
    handleChannelChange(index, { label: value.trim().length > 0 ? value : undefined });
  };

  const handleAddChannel = () => {
    const currentChannels = Array.isArray(config.channels) && config.channels.length > 0 ? config.channels : channels;
    updateChannels([...currentChannels, createEmptyChannel()]);
  };

  const handleRemoveChannel = (index: number) => {
    const currentChannels = Array.isArray(config.channels) && config.channels.length > 0 ? config.channels : channels;
    if (currentChannels.length === 1) {
      updateChannels([
        {
          ...currentChannels[0],
          chatId: "",
          isSelected: true,
          label: undefined,
        },
      ]);
      return;
    }

    const nextChannels = currentChannels.filter((_, channelIndex) => channelIndex !== index);
    updateChannels(nextChannels);
  };

  return (
    <Card
      header={
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
            <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0Zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.14.141-.259.259-.374.261l.213-3.053 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.136-.954l11.566-4.458c.538-.196 1.006.128.832.941Z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Telegram</h3>
            <p className="text-sm text-gray-500">Configure the bot and channel list for simultaneous posting.</p>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Enable Telegram</span>
          <label htmlFor="telegram-enabled" className="relative inline-block h-6 w-12 cursor-pointer">
            <input
              type="checkbox"
              id="telegram-enabled"
              checked={enabled}
              onChange={(event) => onToggle(event.target.checked)}
              className="peer sr-only"
            />
            <div className="relative h-6 w-12 rounded-full bg-gray-200 transition peer-checked:bg-blue-600">
              <span className="absolute left-[2px] top-[2px] block h-5 w-5 rounded-full bg-white transition-all peer-checked:translate-x-6" />
            </div>
          </label>
        </div>

        {enabled && (
          <div className="space-y-6">
            <div>
              <label htmlFor="telegram-bot-token" className="mb-2 block text-sm font-medium text-gray-700">
                Bot token
              </label>
              <input
                id="telegram-bot-token"
                type="password"
                placeholder="Enter the Telegram bot token"
                value={config.botToken}
                onChange={(event) => handleTokenChange(event.target.value)}
                className="w-full rounded-lg border-0 bg-gray-50 px-4 py-3 transition focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700">Channels</h4>
                  <p className="text-xs text-gray-500">
                    Add channel usernames or chat IDs where the bot is an administrator.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddChannel}
                  className="flex items-center justify-center rounded-md border border-blue-200 px-3 py-2 text-sm text-blue-600 transition hover:bg-blue-50"
                >
                  <span className="mr-1 text-lg leading-none">+</span>
                  Add channel
                </button>
              </div>

              <div className="space-y-3">
                {channels.map((channel, index) => (
                  <div
                    key={`${channel.chatId || "channel"}-${index}`}
                    className="space-y-3 rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={channel.isSelected}
                          onChange={(event) => handleToggleChannel(index, event.target.checked)}
                        />
                        Use for publishing
                      </label>

                      {channels.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveChannel(index)}
                          className="text-xs text-blue-600 transition hover:text-blue-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <label className="mb-1 block text-xs font-medium text-gray-500">Channel ID</label>
                        <input
                          type="text"
                          value={channel.chatId}
                          placeholder="@channel or -100..."
                          onChange={(event) => handleChannelIdChange(index, event.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <label className="mb-1 block text-xs font-medium text-gray-500">
                          Optional label
                        </label>
                        <input
                          type="text"
                          value={channel.label ?? ""}
                          placeholder="Add a note to identify the channel"
                          onChange={(event) => handleChannelLabelChange(index, event.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
              <p className="font-semibold">How to prepare Telegram for posting:</p>
              <ol className="mt-2 space-y-1 list-inside list-decimal">
                <li>Create a bot via <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer" className="underline">@BotFather</a>.</li>
                <li>Add the bot as an administrator to every target channel.</li>
                <li>Paste each channel username (with @) or chat ID into the list above.</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
