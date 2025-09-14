import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import type { User } from '@core/types';
import { authService } from './auth';

/**
 * User profile service for handling profile photos and other user profile operations
 */
export const userProfileService = {
  /**
   * Upload a profile photo to Firebase Storage
   * @param file The image file to upload
   * @returns The download URL of the uploaded image
   */
  async uploadProfilePhoto(file: File): Promise<string> {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Initialize Firebase Storage
    const storage = getStorage();
    
    // Create a reference to the profile photos folder with the user's ID
    const profilePhotosRef = ref(storage, `profile-photos/${user.uid}`);
    
    try {
      // Upload the file
      const snapshot = await uploadBytes(profilePhotosRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw new Error('Failed to upload profile photo');
    }
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