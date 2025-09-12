import React from 'react';
import { ConfigForm } from './ConfigForm';
import type { AppConfig } from '../../core/types';

interface ConfigPanelProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
  showActions?: boolean;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ 
  config, 
  onConfigChange, 
  showActions = true
}) => {
  return (
    <ConfigForm
      config={config}
      onConfigChange={onConfigChange}
      showActions={showActions}
    />
  );
};