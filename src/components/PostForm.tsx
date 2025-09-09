import React, { useState } from 'react';
import type { PostDraft } from '../types';

interface PostFormProps {
  onSubmit: (post: PostDraft) => void;
  isPublishing: boolean;
  configuredPlatforms: string[];
}

export const PostForm: React.FC<PostFormProps> = ({ onSubmit, isPublishing, configuredPlatforms }) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSubmit({
      content: content.trim(),
      images: images.filter(img => img.trim()),
    });
  };

  const addImage = () => {
    if (imageUrl.trim() && !images.includes(imageUrl.trim())) {
      setImages([...images, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const clearForm = () => {
    setContent('');
    setImages([]);
    setImageUrl('');
  };

  const canPublish = content.trim() && configuredPlatforms.length > 0;

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
            Изображения (URL):
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              disabled={isPublishing}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={addImage}
              disabled={!imageUrl.trim() || isPublishing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Добавить
            </button>
          </div>
          
          {images.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium text-gray-700">Добавленные изображения:</h4>
              {images.map((img, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                  <img 
                    src={img} 
                    alt={`Preview ${index + 1}`} 
                    className="w-12 h-12 object-cover rounded border"
                  />
                  <span className="flex-1 text-sm text-gray-600 break-all">{img}</span>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    disabled={isPublishing}
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
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