import { getFirestore, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { EncryptionService, type EncryptedData } from './encryption';
import type { AppConfig } from '../types';

/**
 * Secure configuration service that stores encrypted user configurations in Firebase Firestore
 */
export class SecureConfigService {
  private db = getFirestore();
  private auth = getAuth();
  private readonly COLLECTION_NAME = 'user-configs';

  /**
   * Saves user configuration to Firestore with client-side encryption
   */
  async saveConfig(config: AppConfig): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!EncryptionService.isSupported()) {
      throw new Error('Encryption not supported in this environment');
    }

    try {
      // Encrypt the configuration data
      const configJson = JSON.stringify(config);
      const encryptedConfig = await EncryptionService.encrypt(configJson, user.uid);
      
      // Save to Firestore with metadata
      const docRef = doc(this.db, this.COLLECTION_NAME, user.uid);
      await setDoc(docRef, {
        encryptedData: encryptedConfig.encryptedData,
        iv: encryptedConfig.iv,
        salt: encryptedConfig.salt,
        updatedAt: new Date().toISOString(),
        version: '1.0', // For future schema migrations
      });

      console.log('Configuration saved securely to Firestore');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw new Error('Failed to save configuration to secure storage');
    }
  }

  /**
   * Loads user configuration from Firestore with client-side decryption
   */
  async loadConfig(): Promise<AppConfig | null> {
    const user = this.auth.currentUser;
    if (!user) {
      console.warn('User not authenticated, cannot load configuration');
      return null;
    }

    if (!EncryptionService.isSupported()) {
      throw new Error('Encryption not supported in this environment');
    }

    try {
      const docRef = doc(this.db, this.COLLECTION_NAME, user.uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.log('No configuration found for user');
        return null;
      }

      const data = docSnap.data();
      
      // Validate required fields
      if (!data.encryptedData || !data.iv || !data.salt) {
        console.error('Invalid configuration data structure');
        return null;
      }

      // Decrypt the configuration
      const encryptedData: EncryptedData = {
        encryptedData: data.encryptedData,
        iv: data.iv,
        salt: data.salt,
      };

      const decryptedConfigJson = await EncryptionService.decrypt(encryptedData, user.uid);
      const config: AppConfig = JSON.parse(decryptedConfigJson);

      console.log('Configuration loaded securely from Firestore');
      return config;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      // Return null instead of throwing to allow app to continue with empty config
      return null;
    }
  }

  /**
   * Deletes user configuration from Firestore
   */
  async deleteConfig(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const docRef = doc(this.db, this.COLLECTION_NAME, user.uid);
      await deleteDoc(docRef);
      console.log('Configuration deleted from Firestore');
    } catch (error) {
      console.error('Failed to delete configuration:', error);
      throw new Error('Failed to delete configuration from secure storage');
    }
  }

  /**
   * Checks if user has a saved configuration
   */
  async hasConfig(): Promise<boolean> {
    const user = this.auth.currentUser;
    if (!user) {
      return false;
    }

    try {
      const docRef = doc(this.db, this.COLLECTION_NAME, user.uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('Failed to check configuration existence:', error);
      return false;
    }
  }

  /**
   * Migrates existing localStorage configuration to secure Firestore storage
   */
  async migrateFromLocalStorage(): Promise<boolean> {
    const user = this.auth.currentUser;
    if (!user) {
      return false;
    }

    try {
      // Check if user already has Firestore config
      if (await this.hasConfig()) {
        console.log('User already has Firestore configuration, skipping migration');
        return false;
      }

      // Try to load from localStorage with user-specific key
      const legacyConfigKey = `cross-poster-config-${user.uid}`;
      const savedConfig = localStorage.getItem(legacyConfigKey);
      
      if (!savedConfig) {
        console.log('No localStorage configuration found for migration');
        return false;
      }

      // Parse and save to Firestore
      const config: AppConfig = JSON.parse(savedConfig);
      await this.saveConfig(config);

      // Remove from localStorage after successful migration
      localStorage.removeItem(legacyConfigKey);
      
      console.log('Successfully migrated configuration from localStorage to Firestore');
      return true;
    } catch (error) {
      console.error('Failed to migrate configuration from localStorage:', error);
      return false;
    }
  }
}