import type { AppConfig, PlatformConfig, TelegramConfig, VKConfig } from '../types';

/**
 * Validate platform configuration
 */
export function validatePlatformConfig(platform: PlatformConfig): string[] {
  const errors: string[] = [];
  
  switch (platform.platform) {
    case 'telegram': {
      const tgConfig = platform.config as TelegramConfig;
      if (!tgConfig.botToken) {
        errors.push('Bot Token is required for Telegram');
      }
      if (!tgConfig.chatId) {
        errors.push('Chat ID is required for Telegram');
      }
      break;
    }
    case 'vk': {
      const vkConfig = platform.config as VKConfig;
      if (!vkConfig.ownerId) {
        errors.push('Owner ID is required for VK');
      }
      if (!vkConfig.accessToken) {
        errors.push('VK access token is required. Authorize via VK ID.');
      }
      break;
    }
  }
  
  return errors;
}

/**
 * Validate complete app configuration
 */
export function validateConfig(config: AppConfig): string[] {
  const errors: string[] = [];
  
  if (!config.platforms || config.platforms.length === 0) {
    errors.push('At least one platform must be configured');
  }
  
  config.platforms.forEach((platform, index) => {
    const platformErrors = validatePlatformConfig(platform);
    if (platformErrors.length > 0) {
      errors.push(`Platform ${index + 1}: ${platformErrors.join(', ')}`);
    }
  });
  
  return errors;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 6) {
    return { isValid: false, message: 'Password must be at least 6 characters long' };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'Password must be less than 128 characters' };
  }
  
  return { isValid: true };
}