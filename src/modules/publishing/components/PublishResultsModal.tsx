import React from 'react';
import { Modal } from '@core/ui/modal';
import { PublishResults as LocalPublishResults } from './PublishResults';
import type { PublishResponse } from '@core/types';

interface PublishResultsProps {
  results: PublishResponse | null;
  onClose: () => void;
}

export const PublishResultsModal: React.FC<PublishResultsProps> = ({ results, onClose }) => {
  if (!results) return null;

  return (
    <Modal isOpen={!!results} onClose={onClose} title="Результаты публикации">
      <LocalPublishResults results={results} onClose={onClose} />
    </Modal>
  );
};