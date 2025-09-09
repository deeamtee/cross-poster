import React, { useState } from 'react';
import { useSignUp } from '../../hooks/useAuth';
import type { AuthCredentials } from '../../types';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToLogin }) => {
  const [credentials, setCredentials] = useState<AuthCredentials>({
    email: '',
    password: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const { handleSignUp, loading, error, clearError } = useSignUp();

  const validatePasswords = () => {
    if (credentials.password !== confirmPassword) {
      setPasswordError('Пароли не совпадают');
      return false;
    }
    if (credentials.password.length < 6) {
      setPasswordError('Пароль должен содержать минимум 6 символов');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswords()) {
      return;
    }
    
    await handleSignUp(credentials);
  };

  const handleInputChange = (field: keyof AuthCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
    if (passwordError) setPasswordError('');
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (passwordError) setPasswordError('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Регистрация
        </h2>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={credentials.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              required
              value={credentials.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Подтверждение пароля
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          
          {(error || passwordError) && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">
                {passwordError || error?.message}
              </p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <div className="text-gray-600 text-sm">
            Уже есть аккаунт?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Войти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};