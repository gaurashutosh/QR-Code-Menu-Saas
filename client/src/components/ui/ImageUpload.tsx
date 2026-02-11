'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  type?: 'general' | 'logo' | 'menu-item';
  className?: string;
  aspectRatio?: 'square' | 'wide' | 'auto';
}

export function ImageUpload({
  value,
  onChange,
  type = 'general',
  className = '',
  aspectRatio = 'auto',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      let response;
      if (type === 'logo') {
        response = await uploadAPI.uploadLogo(file);
      } else if (type === 'menu-item') {
        response = await uploadAPI.uploadMenuItem(file);
      } else {
        response = await uploadAPI.uploadImage(file);
      }
      
      onChange(response.data.data.url);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  const aspectClasses = {
    square: 'aspect-square',
    wide: 'aspect-video',
    auto: 'min-h-[120px]',
  };

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {value ? (
        <div className={`relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 ${aspectClasses[aspectRatio]}`}>
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-2 bg-white dark:bg-zinc-800 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700"
              disabled={uploading}
            >
              <Upload className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-red-500 rounded-lg text-white hover:bg-red-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => !uploading && inputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            ${aspectClasses[aspectRatio]}
            border-2 border-dashed rounded-xl cursor-pointer transition-all
            flex flex-col items-center justify-center gap-2 p-4
            ${dragActive 
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' 
              : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900/50 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-900'}
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          ) : (
            <>
              <div className="w-12 h-12 bg-gray-200 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Click or drag image to upload
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  PNG, JPG up to 5MB
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
