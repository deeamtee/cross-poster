import React from 'react';
import { Modal } from '@/ui/modal';
import { PublishResults as LocalPublishResults } from './PublishResults';
import type { PublishResponse } from '@types';

interface PublishResultsProps {
  results: PublishResponse | null;
  onClose: () => void;
}

export const PublishResultsModal: React.FC<PublishResultsProps> = ({ results, onClose }) => {
  if (!results) return null;

  return (
    <Modal isOpen={!!results} onClose={onClose} title="Р РµР·СѓР»СЊС‚Р°С‚С‹ РїСѓР±Р»РёРєР°С†РёРё">
      <LocalPublishResults results={results} onClose={onClose} />
    </Modal>
  );
};
