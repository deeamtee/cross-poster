import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { ImagePreview } from '@/ui';
import { getPlatformDisplayName } from '@modules/platform';
import type { PostDraft } from '@types';
import type { Platform } from '@modules/platform';

interface PostFormProps {
  onSubmit: (post: PostDraft) => void;
  isPublishing: boolean;
  configuredPlatforms: Platform[];
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

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() && images.length === 0) return;

    onSubmit({
      content: content.trim() || '', // Send empty string if no content
      images: images.length > 0 ? images : undefined,
    });
  }, [content, images, onSubmit]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const validFiles = Array.from(files).filter(file => {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert(`Р¤Р°Р№Р» "${file.name}" РЅРµ СЏРІР»СЏРµС‚СЃСЏ РёР·РѕР±СЂР°Р¶РµРЅРёРµРј.`);
        return false;
      }
      
      // Check file size (max 20MB for Telegram)
      if (file.size > 20 * 1024 * 1024) {
        alert(`Р¤Р°Р№Р» "${file.name}" СЃР»РёС€РєРѕРј Р±РѕР»СЊС€РѕР№. РњР°РєСЃРёРјР°Р»СЊРЅС‹Р№ СЂР°Р·РјРµСЂ: 20MB.`);
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

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
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

  const canPublish = (content.trim() || images.length > 0) && configuredPlatforms.length > 0;

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">РЎРѕР·РґР°РЅРёРµ РєРѕРЅС‚РµРЅС‚Р°</h1>
        <p className="text-gray-600">РџСѓР±Р»РёРєР°С†РёСЏ РїРѕСЃС‚РѕРІ РІ СЃРѕС†РёР°Р»СЊРЅС‹Рµ СЃРµС‚Рё</p>
      </div>

      {/* Content Type Selector */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium shadow-sm hover:bg-blue-700 transition-all duration-200">
            рџ“ќ РћР±С‹С‡РЅС‹Р№ РїРѕСЃС‚
          </button>
          <button className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 opacity-60 cursor-not-allowed">
            рџЋ¬ Shorts (СЃРєРѕСЂРѕ)
          </button>
          <button className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 opacity-60 cursor-not-allowed">
            рџ“Љ РћРїСЂРѕСЃС‹ (СЃРєРѕСЂРѕ)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Content Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                вњЏпёЏ
              </span>
              РўРµРєСЃС‚ РїРѕСЃС‚Р°
            </h3>
            
            <form onSubmit={handleSubmit}>
              <textarea
                id="post-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Рћ С‡С‘Рј С…РѕС‚РёС‚Рµ СЂР°СЃСЃРєР°Р·Р°С‚СЊ?"
                rows={6}
                disabled={isPublishing}
                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none text-lg"
              />
              <div className="flex justify-end items-center mt-3">
                <div className="text-sm text-gray-500">
                  {content.length}/4096 СЃРёРјРІРѕР»РѕРІ
                </div>
              </div>
              
              {/* Hidden submit button for form submission */}
              <button type="submit" className="hidden" />
            </form>
          </div>

          {/* Media Upload Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                рџ–јпёЏ
              </span>
              РР·РѕР±СЂР°Р¶РµРЅРёСЏ
            </h3>
            
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
              className={`relative rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                dragActive 
                  ? 'bg-blue-50 border-2 border-blue-300 border-dashed' 
                  : 'bg-gray-50 hover:bg-gray-100'
              } ${isPublishing ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-700">
                    РџРµСЂРµС‚Р°С‰РёС‚Рµ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ РёР»Рё РЅР°Р¶РјРёС‚Рµ РґР»СЏ РІС‹Р±РѕСЂР°
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    PNG, JPG, GIF РґРѕ 20MB вЂў РџРѕРґРґРµСЂР¶РёРІР°РµС‚СЃСЏ РјРЅРѕР¶РµСЃС‚РІРµРЅРЅС‹Р№ РІС‹Р±РѕСЂ
                  </p>
                </div>
              </div>
            </div>
            
            {/* Selected Images Grid */}
            {images.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-700 flex items-center">
                    <span className="mr-2">рџ“Ћ</span>
                    РџСЂРёРєСЂРµРїР»С‘РЅРЅС‹Рµ С„Р°Р№Р»С‹ ({images.length})
                  </h4>
                  <button
                    onClick={clearForm}
                    disabled={isPublishing}
                    className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    РћС‡РёСЃС‚РёС‚СЊ РІСЃС‘
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Platform Status Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                рџЊђ
              </span>
              РџР»Р°С‚С„РѕСЂРјС‹
            </h3>
            
            {configuredPlatforms.length > 0 ? (
              <div className="space-y-3">
                {configuredPlatforms.map(platform => (
                  <div key={platform} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="font-medium text-green-800">{getPlatformDisplayName(platform)}</span>
                    </div>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      Р“РѕС‚РѕРІ
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  вљ пёЏ
                </div>
                <p className="text-red-600 font-medium mb-2">
                  РќРµС‚ РЅР°СЃС‚СЂРѕРµРЅРЅС‹С… РїР»Р°С‚С„РѕСЂРј
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  РќР°СЃС‚СЂРѕР№С‚Рµ С…РѕС‚СЏ Р±С‹ РѕРґРЅСѓ РїР»Р°С‚С„РѕСЂРјСѓ РґР»СЏ РїСѓР±Р»РёРєР°С†РёРё
                </p>
                <a
                  href="/settings/access-keys"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  РќР°СЃС‚СЂРѕРёС‚СЊ РєР»СЋС‡Рё
                </a>
              </div>
            )}
          </div>

          {/* Publishing Actions Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                рџљЂ
              </span>
              РџСѓР±Р»РёРєР°С†РёСЏ
            </h3>
            
            <div className="space-y-4">
              <button
                onClick={handleSubmit}
                disabled={!canPublish || isPublishing}
                className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm"
              >
                {isPublishing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>РџСѓР±Р»РёРєСѓРµРј...</span>
                  </>
                ) : (
                  <span>РћРїСѓР±Р»РёРєРѕРІР°С‚СЊ</span>
                )}
              </button>
              
              <button
                onClick={clearForm}
                disabled={isPublishing}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
              >
                РћС‡РёСЃС‚РёС‚СЊ С„РѕСЂРјСѓ
              </button>
              
              {/* Quick Stats */}
              <div className="pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span>РЎРёРјРІРѕР»РѕРІ:</span>
                    <span className={content.length > 3500 ? 'text-yellow-600 font-medium' : ''}>
                      {content.length}/4096
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>РР·РѕР±СЂР°Р¶РµРЅРёР№:</span>
                    <span>{images.length}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span>РџР»Р°С‚С„РѕСЂРјС‹:</span>
                    <span>{configuredPlatforms.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6">
            <h4 className="font-semibold text-gray-900 mb-3">
              рџ’Ў РЎРѕРІРµС‚С‹
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>вЂў РСЃРїРѕР»СЊР·СѓР№С‚Рµ СЌРјРѕРґР·Рё РґР»СЏ РїСЂРёРІР»РµС‡РµРЅРёСЏ РІРЅРёРјР°РЅРёСЏ</p>
              <p>вЂў Р”РѕР±Р°РІСЊС‚Рµ РёР·РѕР±СЂР°Р¶РµРЅРёСЏ РґР»СЏ Р±РѕР»СЊС€РµР№ РІРѕРІР»РµС‡С‘РЅРЅРѕСЃС‚Рё</p>
              <p>вЂў РћРїС‚РёРјР°Р»СЊРЅР°СЏ РґР»РёРЅР° РїРѕСЃС‚Р°: 100-300 СЃРёРјРІРѕР»РѕРІ</p>
              <p>вЂў Р›СѓС‡С€РµРµ РІСЂРµРјСЏ РґР»СЏ РїСѓР±Р»РёРєР°С†РёРё: 19:00-21:00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
