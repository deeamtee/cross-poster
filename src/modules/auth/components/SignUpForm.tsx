import React, { useState } from 'react';
import { Button } from '@core/ui/button';
import { Input } from '@core/ui/input';
import { Spinner } from '@core/ui/spinner';
import type { AuthCredentials } from '@core/types';
import { useAuth } from '..';

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
}

export const SignUpForm = ({ onSwitchToSignIn }: SignUpFormProps) => {
  const [credentials, setCredentials] = useState<AuthCredentials>({ email: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPasswordError(null);
    setLoading(true);

    // Password validation
    if (credentials.password !== confirmPassword) {
      setPasswordError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    if (credentials.password.length < 6) {
      setPasswordError('Пароль должен содержать минимум 6 символов');
      setLoading(false);
      return;
    }

    try {
      const result = await signUp(credentials);
      if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      console.error('Sign up error:', err);
      setError('Произошла ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof AuthCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (passwordError) setPasswordError(null);
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
            <Input
              id="email"
              type="email"
              required
              value={credentials.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <Input
              id="password"
              type="password"
              required
              value={credentials.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Подтверждение пароля
            </label>
            <Input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          {(error || passwordError) && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">
                {passwordError || error}
              </p>
            </div>
          )}
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {loading ? <Spinner /> : 'Зарегистрироваться'}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <div className="text-gray-600 text-sm">
            Уже есть аккаунт?{' '}
            <Button
              onClick={onSwitchToSignIn}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Войти
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};