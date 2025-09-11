import React from 'react';
import { AuthModal } from '../../../modules/auth/components';

export const AuthPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full">
        <AuthModal isOpen={true} onClose={() => {}} />
      </div>
    </div>
  );
};