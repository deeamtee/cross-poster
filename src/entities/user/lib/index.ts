import type { User } from '../model';

/**
 * Get user display name or fallback to email
 */
export function getUserDisplayName(user: User): string {
  return user.displayName || user.email || 'User';
}

/**
 * Get user initials for avatar
 */
export function getUserInitials(user: User): string {
  const name = getUserDisplayName(user);
  return name
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

/**
 * Check if user has a profile photo
 */
export function hasProfilePhoto(user: User): boolean {
  return Boolean(user.photoURL);
}