/**
 * Format date to readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get relative time string (e.g., "2 minutes ago")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} РґРЅ. РЅР°Р·Р°Рґ`;
  if (hours > 0) return `${hours} С‡. РЅР°Р·Р°Рґ`;
  if (minutes > 0) return `${minutes} РјРёРЅ. РЅР°Р·Р°Рґ`;
  return 'С‚РѕР»СЊРєРѕ С‡С‚Рѕ';
}
