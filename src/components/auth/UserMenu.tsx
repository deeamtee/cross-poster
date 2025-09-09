import React from 'react';
import { useAuth } from '../../contexts';

interface UserMenuProps {
  onSettingsClick: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onSettingsClick }) => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center space-x-4">
      <div className="text-right">
        <p className="text-sm font-medium text-gray-800">
          {user.displayName || 'Пользователь'}
        </p>
        <p className="text-xs text-gray-600">
          {user.email}
        </p>
      </div>
      
      <div className="flex space-x-2">
        <button
          onClick={onSettingsClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          Настройки
        </button>
        
        <button
          onClick={handleSignOut}
          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          Выйти
        </button>
      </div>
    </div>
  );
};