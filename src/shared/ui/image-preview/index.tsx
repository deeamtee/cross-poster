import React from 'react';

interface ImagePreviewProps {
  file: File;
  imageUrl: string;
  index: number;
  onRemove: (index: number) => void;
  isDisabled: boolean;
  formatFileSize: (bytes: number) => string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = React.memo(({ 
  file, 
  imageUrl, 
  index, 
  onRemove, 
  isDisabled, 
  formatFileSize 
}) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
      <img 
        src={imageUrl} 
        alt={`Preview ${index + 1}`} 
        className="w-12 h-12 object-cover rounded border"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(index)}
        disabled={isDisabled}
        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm transition-colors"
      >
        ×
      </button>
    </div>
  );
});

ImagePreview.displayName = 'ImagePreview';