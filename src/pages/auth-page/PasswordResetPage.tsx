import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PasswordResetForm } from '@/modules/auth/components/PasswordResetForm';

export const PasswordResetPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full">
        <PasswordResetForm onBack={handleBack} />
      </div>
    </div>
  );
};