import React from 'react';
import type { PublishResponse } from '../types';

interface PublishResultsProps {
  results: PublishResponse | null;
  onClose: () => void;
}

export const PublishResults: React.FC<PublishResultsProps> = ({ results, onClose }) => {
  if (!results) return null;

  return (
    <div className="results-overlay">
      <div className="results-modal">
        <h2>Результаты публикации</h2>
        
        <div className="results-summary">
          <div className="summary-item success">
            <strong>Успешно:</strong> {results.totalSuccess}
          </div>
          <div className="summary-item failure">
            <strong>Ошибки:</strong> {results.totalFailure}
          </div>
        </div>

        <div className="results-details">
          {results.results.map((result, index) => (
            <div
              key={`${result.platform}-${index}`}
              className={`result-item ${result.success ? 'success' : 'error'}`}
            >
              <div className="result-header">
                <strong>{result.platform.toUpperCase()}</strong>
                <span className={`status ${result.success ? 'success' : 'error'}`}>
                  {result.success ? '✓' : '✗'}
                </span>
              </div>
              
              {result.success ? (
                <div className="result-success">
                  Пост успешно опубликован
                  {result.messageId && (
                    <div className="message-id">ID: {result.messageId}</div>
                  )}
                </div>
              ) : (
                <div className="result-error">
                  <strong>Ошибка:</strong> {result.error}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="results-actions">
          <button onClick={onClose} className="btn-primary">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};