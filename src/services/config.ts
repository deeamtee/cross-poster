import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { encryptionApi } from '.';
import type { AppConfig } from '../core/types';

// Define the interface inline to avoid import issues
interface EncryptedData {
  encryptedData: string;
  iv: string;
  salt: string;
}

export const configApi = {
  async saveConfig(config: AppConfig): Promise<void> {
    console.log('Saving config to Firestore:', config);
    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!encryptionApi.isSupported()) {
      throw new Error('Encryption not supported in this environment');
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

      console.log('Configuration saved securely to Firestore');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw new Error('Failed to save configuration to secure storage');
    }
  },

  async loadConfig(): Promise<AppConfig | null> {
    console.log('Loading config from Firestore');
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
        console.log('No configuration found for user');
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

      console.log('Decrypted config:', config);

      // Sanitize the loaded configuration to ensure it conforms to current types
      // Make sure we preserve all valid platform configurations
      const sanitizedConfig: AppConfig = {
        platforms: config.platforms.filter(platformConfig => 
          platformConfig.platform === 'telegram' && 
          platformConfig.config &&
          typeof platformConfig.config === 'object'
        )
      };

      console.log('Sanitized config:', sanitizedConfig);

      console.log('Configuration loaded securely from Firestore');
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
      console.log('Configuration deleted from Firestore');
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
        console.log('User already has Firestore configuration, skipping migration');
        return false;
      }

      const legacyConfigKey = `cross-poster-config-${user.uid}`;
      const savedConfig = localStorage.getItem(legacyConfigKey);
      
      if (!savedConfig) {
        console.log('No localStorage configuration found for migration');
        return false;
      }

      const config: AppConfig = JSON.parse(savedConfig);
      console.log('Migrating localStorage config:', config);
      await this.saveConfig(config);

      localStorage.removeItem(legacyConfigKey);
      
      console.log('Successfully migrated configuration from localStorage to Firestore');
      return true;
    } catch (error) {
      console.error('Failed to migrate configuration from localStorage:', error);
      return false;
    }
  }
};