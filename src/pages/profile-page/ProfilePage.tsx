import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@modules/auth';
import { userProfileService } from '@modules/profile';
import { getUserInitials, hasProfilePhoto } from '@modules/user';
import { Spinner } from '@/ui/spinner';
import { Card } from '@/ui/card';

export const ProfilePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize display name from user
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.email || '');
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Upload the profile photo
      const photoURL = await userProfileService.uploadProfilePhoto(file);
      
      // Update user profile with new photo URL
      await userProfileService.updateProfile(user, { photoURL });
      
      setSuccess('Фото профиля успешно обновлено');
    } catch (err) {
      console.error('Error uploading profile photo:', err);
      setError('Не удалось загрузить фото профиля');
    } finally {
      setLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await userProfileService.updateProfile(user, { displayName });
      setSuccess('Профиль успешно обновлен');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Не удалось обновить профиль');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setDisplayName(user.displayName || user.email || '');
    }
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Пользователь не авторизован</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Профиль</h2>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Photo Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {hasProfilePhoto(user) ? (
                <img 
                  src={user.photoURL || ''} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center border-4 border-white shadow-md">
                  <span className="text-2xl font-bold text-blue-600">
                    {getUserInitials(user)}
                  </span>
                </div>
              )}
              
              <button
                onClick={triggerFileInput}
                disabled={loading}
                className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-md transition-colors"
                title="Изменить фото"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={loading}
              className="hidden"
            />
            
            <p className="mt-4 text-sm text-gray-600 text-center">
              JPG, PNG или GIF
              <br />
              Макс. размер: 5MB
            </p>
          </div>
          
          {/* Profile Info Section */}
          <div className="flex-1">
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500"
                />
              </div>
              
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                  Имя
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={!isEditing || loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              
              <div className="flex flex-wrap gap-3 pt-4">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                  >
                    Редактировать профиль
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <Spinner size="sm" className="mr-2" />
                          Сохранение...
                        </span>
                      ) : (
                        'Сохранить'
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md transition-colors disabled:opacity-50"
                    >
                      Отмена
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Status Messages */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        )}
      </Card>
    </div>
  );
};
