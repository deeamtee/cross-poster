import React from 'react';
import { ConfigForm } from './ConfigForm';
import { Modal } from '../../../core/ui/modal';
import type { AppConfig } from '../../../core/types';

interface ConfigPanelProps {
  config: AppConfig;
  isOpen?: boolean;
  onConfigChange: (config: AppConfig) => void;
  onClose?: () => void;
  showActions?: boolean;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ 
  config, 
  isOpen = true, 
  onConfigChange, 
  onClose,
  showActions = true
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose || (() => {})} title="Настройки платформ">
      <ConfigForm
        config={config}
        onConfigChange={onConfigChange}
        onClose={onClose}
        showActions={showActions}
      />
    </Modal>
  );
};