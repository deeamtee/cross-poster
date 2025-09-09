import React from 'react';
import { AuthModal as LocalAuthModal } from './AuthModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  return (
    <LocalAuthModal isOpen={isOpen} onClose={onClose} />
  );
};