import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { encryptionApi } from '.';
import { mergeVkConfigWithStoredToken, saveVkTokenFromConfig, clearStoredVkToken } from './vk-token.storage';
import type { AppConfig, VKConfig } from '@core/types';

// Define the interface inline to avoid import issues
interface EncryptedData {
  encryptedData: string;
  iv: string;
  salt: string;
}

export const configApi = {
  async saveConfig(config: AppConfig): Promise<void> {
    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!encryptionApi.isSupported()) {
      throw new Error('Encryption not supported in this environment');
    }

    const vkPlatform = config.platforms.find((platform) => platform.platform === 'vk');
    if (vkPlatform) {
      saveVkTokenFromConfig(vkPlatform.config as VKConfig);
    } else {
      clearStoredVkToken();
    }

    try {
      const configJson = JSON.stringify(config);
      const encryptedConfig = await encryptionApi.encrypt(configJson, user.uid);

      const docRef = doc(db, 'user-configs', user.uid);
      await setDoc(docRef, {
        encryptedData: encryptedConfig.encryptedData,
        iv: encryptedConfig.iv,
        salt: encryptedConfig.salt,
        updatedAt: new Date().toISOString(),
        version: '1.0',
      });
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw new Error('Failed to save configuration to secure storage');
    }
  },

  async loadConfig(): Promise<AppConfig | null> {
    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.warn('User not authenticated, cannot load configuration');
      return null;
    }

    if (!encryptionApi.isSupported()) {
      throw new Error('Encryption not supported in this environment');
    }

    try {
      const docRef = doc(db, 'user-configs', user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();

      if (!data.encryptedData || !data.iv || !data.salt) {
        console.error('Invalid configuration data structure');
        return null;
      }

      const encryptedData: EncryptedData = {
        encryptedData: data.encryptedData,
        iv: data.iv,
        salt: data.salt,
      };

      const decryptedConfigJson = await encryptionApi.decrypt(encryptedData, user.uid);
      const config: AppConfig = JSON.parse(decryptedConfigJson);

      const sanitizedPlatforms = config.platforms
        .filter((platformConfig) =>
          (platformConfig.platform === 'telegram' || platformConfig.platform === 'vk') &&
          platformConfig.config &&
          typeof platformConfig.config === 'object'
        )
        .map((platformConfig) => {
          if (platformConfig.platform === 'vk') {
            const rawConfig = platformConfig.config as Partial<VKConfig> & { groupId?: string };
            const normalizedConfig: VKConfig = {
              ownerId: typeof rawConfig.ownerId === 'string' && rawConfig.ownerId.length > 0
                ? rawConfig.ownerId
                : rawConfig.groupId
                ? String(rawConfig.groupId)
                : '',
              accessToken: rawConfig.accessToken,
              accessTokenExpiresAt: rawConfig.accessTokenExpiresAt,
              userId: rawConfig.userId,
              refreshToken: rawConfig.refreshToken,
              scope: rawConfig.scope,
              deviceId: rawConfig.deviceId,
            };

            const mergedConfig = mergeVkConfigWithStoredToken(normalizedConfig);
            saveVkTokenFromConfig(mergedConfig);

            return {
              ...platformConfig,
              config: mergedConfig,
            };
          }

          return platformConfig;
        });

      const sanitizedConfig: AppConfig = {
        platforms: sanitizedPlatforms,
      };

      return sanitizedConfig;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      return null;
    }
  },

  async deleteConfig(): Promise<void> {
    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const docRef = doc(db, 'user-configs', user.uid);
      await deleteDoc(docRef);
      clearStoredVkToken();
    } catch (error) {
      console.error('Failed to delete configuration:', error);
      throw new Error('Failed to delete configuration from secure storage');
    }
  },

  async hasConfig(): Promise<boolean> {
    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      return false;
    }

    try {
      const docRef = doc(db, 'user-configs', user.uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('Failed to check configuration existence:', error);
      return false;
    }
  },

  async migrateFromLocalStorage(): Promise<boolean> {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      return false;
    }

    try {
      if (await this.hasConfig()) {
        return false;
      }

      const legacyConfigKey = `cross-poster-config-${user.uid}`;
      const savedConfig = localStorage.getItem(legacyConfigKey);

      if (!savedConfig) {
        return false;
      }

      const config: AppConfig = JSON.parse(savedConfig);
      const upgradedPlatforms = config.platforms?.map((platform) => {
        if (platform.platform === 'vk') {
          const vk = platform.config as Partial<VKConfig> & { groupId?: string };
          const normalizedVk: VKConfig = {
            ownerId: typeof vk.ownerId === 'string' && vk.ownerId.length > 0
              ? vk.ownerId
              : vk.groupId
              ? String(vk.groupId)
              : '',
            accessToken: vk.accessToken,
            accessTokenExpiresAt: vk.accessTokenExpiresAt,
            userId: vk.userId,
            refreshToken: vk.refreshToken,
            scope: vk.scope,
            deviceId: vk.deviceId,
          };

          const mergedVk = mergeVkConfigWithStoredToken(normalizedVk);
          return {
            ...platform,
            config: mergedVk,
          };
        }

        return platform;
      }) ?? [];

      const upgradedConfig: AppConfig = { platforms: upgradedPlatforms };
      const vkPlatform = upgradedConfig.platforms.find((platform) => platform.platform === 'vk');
      if (vkPlatform) {
        saveVkTokenFromConfig(vkPlatform.config as VKConfig);
      } else {
        clearStoredVkToken();
      }

      await this.saveConfig(upgradedConfig);

      localStorage.removeItem(legacyConfigKey);

      return true;
    } catch (error) {
      console.error('Failed to migrate configuration from localStorage:', error);
      return false;
    }
  },
};
