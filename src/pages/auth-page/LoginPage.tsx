import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/modules/auth/components/LoginForm';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSwitchToSignUp = () => {
    navigate('/auth/signup');
  };

  const handleSwitchToPasswordReset = () => {
    navigate('/auth/reset-password');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full">
        <LoginForm 
          onSwitchToSignUp={handleSwitchToSignUp}
          onSwitchToPasswordReset={handleSwitchToPasswordReset}
        />
      </div>
    </div>
  );
};