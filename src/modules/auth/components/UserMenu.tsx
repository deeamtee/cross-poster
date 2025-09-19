import React from 'react';
import { useAuth } from '../context';

interface UserMenuProps {
  className?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ className = '' }) => {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-sm text-gray-600">
        {user.email}
      </span>
      <button
        onClick={signOut}
        className="text-sm text-red-600 hover:text-red-700 transition-colors"
      >
        Выйти
      </button>
    </div>
  );
};
