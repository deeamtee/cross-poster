import React from 'react';
import { Modal } from '../../../shared/ui';
import { ConfigForm } from './ConfigForm';
import type { AppConfig } from '../../../shared/types';

interface ConfigPanelProps {
  config: AppConfig;
  isOpen: boolean;
  onConfigChange: (config: AppConfig) => void;
  onClose: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ 
  config, 
  isOpen, 
  onConfigChange, 
  onClose 
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Настройки платформ">
      <ConfigForm
        config={config}
        onConfigChange={onConfigChange}
        onClose={onClose}
      />
    </Modal>
  );
};