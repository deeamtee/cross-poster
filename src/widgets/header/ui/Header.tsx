import React from 'react';
import { useAuth } from '../../../features/auth/model';

interface HeaderProps {
  onSettingsClick: () => void;
  onAuthClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSettingsClick, onAuthClick }) => {
  const { user, signOut, isAuthenticated } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800">Cross Poster</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
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
              </>
            ) : (
              <button
                onClick={onAuthClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};