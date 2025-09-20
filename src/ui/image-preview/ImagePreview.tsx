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
        className="p-1.5 text-gray-400 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:text-gray-300 disabled:cursor-not-allowed cursor-pointer transition-colors"
        aria-label={`Удалить изображение ${index + 1}`}
        title="Удалить изображение"
      >
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
        >
          <path strokeLinecap="round" d="M18 6L6 18" />
          <path strokeLinecap="round" d="M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
});

ImagePreview.displayName = 'ImagePreview';
