import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import type { DragEvent } from 'react';
import type { PostDraft } from '../../../shared/types';
import { ImagePreview } from '../../../shared/ui/image-preview';

interface PostFormProps {
  onSubmit: (post: PostDraft) => void;
  isPublishing: boolean;
  configuredPlatforms: string[];
}

export const PostForm: React.FC<PostFormProps> = ({ onSubmit, isPublishing, configuredPlatforms }) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoize image URLs to prevent recreating them on every render
  const imageUrls = useMemo(() => {
    return images.map(file => URL.createObjectURL(file));
  }, [images]);

  // Cleanup URLs when component unmounts or images change
  useEffect(() => {
    return () => {
      imageUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imageUrls]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSubmit({
      content: content.trim(),
      images: images.length > 0 ? images : undefined,
    });
  }, [content, images, onSubmit]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const validFiles = Array.from(files).filter(file => {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert(`Файл "${file.name}" не является изображением.`);
        return false;
      }
      
      // Check file size (max 20MB for Telegram)
      if (file.size > 20 * 1024 * 1024) {
        alert(`Файл "${file.name}" слишком большой. Максимальный размер: 20MB.`);
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length > 0) {
      setImages(prev => [...prev, ...validFiles]);
    }
  }, []);

  const handleDivClick = useCallback(() => {
    if (!isPublishing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isPublishing]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Clear the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const removeImage = useCallback((index: number) => {
    // Revoke the URL for the image being removed
    if (imageUrls[index]) {
      URL.revokeObjectURL(imageUrls[index]);
    }
    setImages(images.filter((_, i) => i !== index));
  }, [images, imageUrls]);

  const clearForm = useCallback(() => {
    // Revoke all URLs when clearing form
    imageUrls.forEach(url => URL.revokeObjectURL(url));
    setContent('');
    setImages([]);
  }, [imageUrls]);

  const canPublish = content.trim() && configuredPlatforms.length > 0;

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Создать пост
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Post Content */}
        <div>
          <label htmlFor="post-content" className="block text-sm font-medium text-gray-700 mb-2">
            Текст поста:
          </label>
          <textarea
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Введите текст вашего поста..."
            rows={4}
            disabled={isPublishing}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="text-right text-sm text-gray-500 mt-1">
            {content.length}/4096 символов
          </div>
        </div>

        {/* Images Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Изображения:
          </label>
          
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            disabled={isPublishing}
            className="hidden"
          />
          
          {/* Drag and Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleDivClick}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            } ${isPublishing ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <div className="space-y-2">
              <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600">
                <span className="font-medium">Нажмите для выбора</span> или перетащите изображения сюда
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF до 20MB (поддерживается несколько файлов)
              </p>
            </div>
          </div>
          
          {/* Selected Images */}
          {images.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-gray-700">Выбранные изображения ({images.length}):</h4>
              <div className="space-y-2">
                {images.map((file, index) => (
                  <ImagePreview
                    key={`${file.name}-${file.size}-${index}`}
                    file={file}
                    imageUrl={imageUrls[index]}
                    index={index}
                    onRemove={removeImage}
                    isDisabled={isPublishing}
                    formatFileSize={formatFileSize}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Platform Status */}
        <div className="bg-gray-50 rounded-md p-4">
          <h4 className="font-medium text-gray-700 mb-3">Настроенные платформы:</h4>
          {configuredPlatforms.length > 0 ? (
            <div className="space-y-2">
              {configuredPlatforms.map(platform => (
                <div key={platform} className="flex items-center gap-2 text-green-700">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="font-medium">{platform}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-red-600">
              Нет настроенных платформ. Настройте хотя бы одну платформу для публикации.
            </p>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-center gap-4">
          <button
            type="submit"
            disabled={!canPublish || isPublishing}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors flex items-center gap-2"
          >
            {isPublishing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Публикация...
              </>
            ) : (
              'Опубликовать пост'
            )}
          </button>
          
          <button
            type="button"
            onClick={clearForm}
            disabled={isPublishing}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Очистить
          </button>
        </div>
      </form>
    </div>
  );
};