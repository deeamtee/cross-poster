import type { User } from '@types';
import { authService } from '@modules/auth';

/**
 * User profile service for handling profile photos and other user profile operations
 */
export const userProfileService = {
  /**
   * Convert a profile photo to a data URL for temporary storage before uploading to backend
   * @param file The image file to upload
   * @returns A data URL representing the uploaded image
   */
  async uploadProfilePhoto(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Unsupported file format'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Failed to read profile photo'));
      };
      reader.readAsDataURL(file);
    });
  },
  
  /**
   * Update user profile information
   * @param user The current user object
   * @param profile The profile data to update
   * @returns Updated user object
   */
  async updateProfile(user: User, profile: { displayName?: string; photoURL?: string }): Promise<User> {
    return await authService.updateProfile(user, profile);
  }
};
