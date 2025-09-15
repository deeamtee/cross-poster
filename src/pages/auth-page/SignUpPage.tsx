import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SignUpForm } from '@/modules/auth/components/SignUpForm';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSwitchToLogin = () => {
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full">
        <SignUpForm onSwitchToLogin={handleSwitchToLogin} />
      </div>
    </div>
  );
};