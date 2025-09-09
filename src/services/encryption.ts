/**
 * Encryption utilities using Web Crypto API for secure configuration storage
 */

export interface EncryptedData {
  encryptedData: string;
  iv: string;
  salt: string;
}

export class EncryptionService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;
  private static readonly SALT_LENGTH = 16;

  /**
   * Generates a cryptographic key from user ID and additional entropy
   */
  private static async generateKey(userId: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(userId),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts data using AES-GCM with user-specific key derivation
   */
  static async encrypt(data: string, userId: string): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    
    // Derive key from user ID and salt
    const key = await this.generateKey(userId, salt);
    
    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv: iv },
      key,
      dataBuffer
    );
    
    return {
      encryptedData: this.arrayBufferToBase64(encryptedBuffer),
      iv: this.arrayBufferToBase64(iv),
      salt: this.arrayBufferToBase64(salt),
    };
  }

  /**
   * Decrypts data using AES-GCM with user-specific key derivation
   */
  static async decrypt(encryptedData: EncryptedData, userId: string): Promise<string> {
    const encryptedBuffer = this.base64ToArrayBuffer(encryptedData.encryptedData);
    const iv = this.base64ToArrayBuffer(encryptedData.iv);
    const salt = this.base64ToArrayBuffer(encryptedData.salt);
    
    // Derive the same key used for encryption
    const key = await this.generateKey(userId, new Uint8Array(salt));
    
    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: this.ALGORITHM, iv: new Uint8Array(iv) },
      key,
      encryptedBuffer
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  /**
   * Converts ArrayBuffer to Base64 string
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Converts Base64 string to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Validates if the current environment supports required crypto features
   */
  static isSupported(): boolean {
    return (
      typeof crypto !== 'undefined' &&
      typeof crypto.subtle !== 'undefined' &&
      typeof crypto.getRandomValues === 'function'
    );
  }
}