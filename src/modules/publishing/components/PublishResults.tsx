import React from 'react';
import type { PublishResponse, PostResult } from '@types';

interface PublishResultsProps {
  results: PublishResponse | null;
  onClose: () => void;
}

export const PublishResults: React.FC<PublishResultsProps> = ({ results, onClose }) => {
  if (!results) return null;

  return (
    <div className="p-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">вњ“</span>
            </div>
            <span className="font-semibold text-green-800">РЈСЃРїРµС€РЅРѕ</span>
          </div>
          <div className="text-2xl font-bold text-green-800">{results.totalSuccess}</div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">Г—</span>
            </div>
            <span className="font-semibold text-red-800">РћС€РёР±РєРё</span>
          </div>
          <div className="text-2xl font-bold text-red-800">{results.totalFailure}</div>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="space-y-3 mb-6">
        {results.results.map((result: PostResult, index: number) => (
          <div
            key={`${result.platform}-${index}`}
            className={`border rounded-lg p-4 ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  result.success 
                    ? 'bg-green-600 text-white' 
                    : 'bg-red-600 text-white'
                }`}>
                  {result.platform.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {result.success ? (
                  <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">вњ“</span>
                  </div>
                ) : (
                  <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">Г—</span>
                  </div>
                )}
              </div>
            </div>
            
            {result.success ? (
              <div className="space-y-2">
                <p className="text-green-800 font-medium">
                  РџРѕСЃС‚ СѓСЃРїРµС€РЅРѕ РѕРїСѓР±Р»РёРєРѕРІР°РЅ
                </p>
                {result.messageId && (
                  <div className="flex items-center gap-1 text-sm text-green-700">
                    <span className="text-gray-500">#</span>
                    <span>ID: {result.messageId}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                  <span className="text-white text-xs">!</span>
                </div>
                <div className="text-red-800">
                  <span className="font-medium">РћС€РёР±РєР°:</span>
                  <p className="text-sm mt-1">{result.error}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <button 
          onClick={onClose} 
          className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Р—Р°РєСЂС‹С‚СЊ
        </button>
      </div>
    </div>
  );
};
