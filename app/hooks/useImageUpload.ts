import { useState, useCallback, useRef } from 'react';

export interface ImageData {
  id: string;
  base64: string;
  originalName: string;
  size: number;
  isLoading?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGES = 5;
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const useImageUpload = () => {
  const [selectedImages, setSelectedImages] = useState<ImageData[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress and convert image to base64
  const processImage = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 1024px on longest side)
        const maxSize = 1024;
        let { width, height } = img;
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = compressedDataUrl.split(',')[1];
        resolve(base64);
      };
      
      img.onerror = () => reject(new Error('Failed to process image'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return `Unsupported format: ${file.type}. Supported: JPEG, PNG, GIF, WebP`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }
    return null;
  }, []);

  const handleFiles = useCallback(async (files: FileList) => {
    if (selectedImages.length >= MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (let i = 0; i < Math.min(files.length, MAX_IMAGES - selectedImages.length); i++) {
      const file = files[i];
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    if (validFiles.length === 0) return;

    // Add loading placeholders
    const newImages: ImageData[] = validFiles.map(file => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      base64: '',
      originalName: file.name,
      size: file.size,
      isLoading: true,
    }));

    setSelectedImages(prev => [...prev, ...newImages]);

    // Process images
    for (let i = 0; i < validFiles.length; i++) {
      try {
        const base64 = await processImage(validFiles[i]);
        setSelectedImages(prev => prev.map(img => 
          img.id === newImages[i].id 
            ? { ...img, base64, isLoading: false }
            : img
        ));
      } catch (error) {
        console.error('Error processing image:', error);
        setSelectedImages(prev => prev.filter(img => img.id !== newImages[i].id));
        setError(`Failed to process ${validFiles[i].name}`);
      }
    }
  }, [selectedImages.length, validateFile, processImage]);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    await handleFiles(files);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFiles(files);
    }
  }, [handleFiles]);

  const removeImage = useCallback((id: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== id));
  }, []);

  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const clearImages = useCallback(() => {
    setSelectedImages([]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    selectedImages,
    isDragOver,
    error,
    fileInputRef,
    handleImageUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeImage,
    handleImageButtonClick,
    clearImages,
    clearError,
    MAX_IMAGES,
  };
};
