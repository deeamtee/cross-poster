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
    <div className="post-form">
      <h2>Создать пост</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="post-content">Текст поста:</label>
          <textarea
            id="post-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Введите текст вашего поста..."
            rows={6}
            disabled={isPublishing}
          />
          <div className="char-counter">
            {content.length}/4096 символов
          </div>
        </div>

        <div className="field">
          <label>Изображения (URL):</label>
          <div className="image-input-group">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              disabled={isPublishing}
            />
            <button
              type="button"
              onClick={addImage}
              disabled={!imageUrl.trim() || isPublishing}
              className="btn-secondary"
            >
              Добавить
            </button>
          </div>
          
          {images.length > 0 && (
            <div className="image-list">
              <h4>Добавленные изображения:</h4>
              {images.map((img, index) => (
                <div key={index} className="image-item">
                  <img src={img} alt={`Preview ${index + 1}`} className="image-preview" />
                  <span className="image-url">{img}</span>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    disabled={isPublishing}
                    className="btn-remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="platform-status">
          <h4>Настроенные платформы:</h4>
          {configuredPlatforms.length > 0 ? (
            <ul>
              {configuredPlatforms.map(platform => (
                <li key={platform} className="platform-item">
                  ✓ {platform}
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-platforms">
              Нет настроенных платформ. Настройте хотя бы одну платформу для публикации.
            </p>
          )}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={!canPublish || isPublishing}
            className="btn-primary btn-publish"
          >
            {isPublishing ? (
              <>
                <span className="spinner"></span>
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
            className="btn-secondary"
          >
            Очистить
          </button>
        </div>
      </form>
    </div>
  );
};