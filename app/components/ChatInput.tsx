"use client";

import React from "react";

import {
  useTheme,
  Box,
  TextField,
  IconButton,
  Stack,
  alpha,
  Modal,
  Backdrop,
  Typography,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CancelIcon from "@mui/icons-material/Stop";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { useRef, useCallback, useMemo, useState } from "react";
import { useModel } from "../context/ModelContext";

interface ChatInputProps {
  onSend: (message: string, images?: string[]) => Promise<void>;
  input: string;
  setInput: (value: string) => void;
  disabled?: boolean;
  isProcessing: boolean;
  cancel: () => void;
}

interface ImageData {
  id: string;
  base64: string;
  originalName: string;
  size: number;
  isLoading?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGES = 5;
const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Optimized component with memoization
const ChatInput: React.FC<ChatInputProps> = React.memo(({
  onSend,
  input,
  setInput,
  isProcessing,
  cancel,
}) => {
  const theme = useTheme();
  const { isVisionModel } = useModel();
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImages, setSelectedImages] = useState<ImageData[]>([]);
  const [previewImage, setPreviewImage] = useState<{ src: string; index: number; data: ImageData } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    const readyImages = selectedImages.filter(img => !img.isLoading);
    
    if ((!trimmed && readyImages.length === 0) || isProcessing) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    const imagesToSend = readyImages.map(img => img.base64);
    setInput("");
    setSelectedImages([]);

    try {
      await onSend(trimmed, imagesToSend.length > 0 ? imagesToSend : undefined);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Send aborted");
      } else {
        console.error("Send error:", error);
        setError("Failed to send message. Please try again.");
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [input, isProcessing, onSend, setInput, selectedImages]);

  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    cancel();
  }, [cancel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, [setInput]);

  const base64ToDataUrl = (base64: string) => `data:image/*;base64,${base64}`;

  const openImagePreview = useCallback((img: ImageData, index: number) => {
    if (!img.isLoading && img.base64) {
      setPreviewImage({ src: base64ToDataUrl(img.base64), index, data: img });
    }
  }, []);

  const closeImagePreview = useCallback(() => {
    setPreviewImage(null);
  }, []);

  const removeImageFromPreview = useCallback(() => {
    if (previewImage) {
      removeImage(previewImage.data.id);
      closeImagePreview();
    }
  }, [previewImage, removeImage, closeImagePreview]);

  const totalImageSize = useMemo(() => {
    return selectedImages.reduce((total, img) => total + img.size, 0);
  }, [selectedImages]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Memoized styles
  const containerStyles = useMemo(() => ({
    display: "flex",
    flexDirection: "column" as const,
    borderRadius: "12px",
    bgcolor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
    border: `1px solid ${isDragOver ? theme.palette.primary.main : theme.palette.divider}`,
    px: 2,
    py: 1.5,
    position: "relative" as const,
    overflow: "hidden",
    transition: "border-color 0.2s ease-in-out",
  }), [theme.palette.mode, theme.palette.divider, theme.palette.primary.main, isDragOver]);

  const textFieldStyles = useMemo(() => ({
    pr: isVisionModel ? 12 : 6,
    fontSize: "1rem",
  }), [isVisionModel]);

  const buttonStyles = useMemo(() => ({
    position: "absolute" as const,
    right: 12,
    bottom: 12,
    bgcolor: isProcessing ? "#fff" : theme.palette.primary.main,
    color: isProcessing ? "#000" : theme.palette.primary.contrastText,
    "&:hover": {
      bgcolor: isProcessing ? "#ddd" : theme.palette.primary.dark,
    },
    width: 36,
    height: 36,
    borderRadius: "12px",
  }), [isProcessing, theme.palette.primary.main, theme.palette.primary.contrastText, theme.palette.primary.dark]);

  const imageButtonStyles = useMemo(() => ({
    position: "absolute" as const,
    right: 54,
    bottom: 12,
    bgcolor: selectedImages.length > 0 ? theme.palette.secondary.main : alpha(theme.palette.primary.main, 0.1),
    color: selectedImages.length > 0 ? theme.palette.secondary.contrastText : theme.palette.primary.main,
    "&:hover": {
      bgcolor: selectedImages.length > 0 ? theme.palette.secondary.dark : alpha(theme.palette.primary.main, 0.2),
    },
    width: 36,
    height: 36,
    borderRadius: "12px",
  }), [selectedImages.length, theme.palette.primary.main, theme.palette.secondary.main, theme.palette.secondary.contrastText, theme.palette.secondary.dark]);

  const inputProps = useMemo(() => ({ disableUnderline: true }), []);

  const canSend = !isProcessing && (input.trim() || selectedImages.some(img => !img.isLoading));

  return (
    <>
      <Box 
        sx={containerStyles}
        onDragOver={isVisionModel ? handleDragOver : undefined}
        onDragLeave={isVisionModel ? handleDragLeave : undefined}
        onDrop={isVisionModel ? handleDrop : undefined}
      >
        {/* Drag overlay */}
        {isDragOver && isVisionModel && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              border: `2px dashed ${theme.palette.primary.main}`,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <CloudUploadIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />
              <Typography variant="h6" color="primary">
                Drop images here
              </Typography>
            </Stack>
          </Box>
        )}

        {/* Image preview thumbnails */}
        {selectedImages.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {selectedImages.map((img, index) => (
                <Box
                  key={img.id}
                  sx={{
                    position: "relative",
                    width: 64,
                    height: 64,
                    borderRadius: 2.5,
                    overflow: "hidden",
                    border: `2px solid ${theme.palette.primary.main}`,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                    transition: "all 0.2s ease-in-out",
                    cursor: img.isLoading ? "default" : "pointer",
                    "&:hover": img.isLoading ? {} : {
                      transform: "scale(1.05)",
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                    },
                  }}
                  onClick={() => !img.isLoading && openImagePreview(img, index)}
                >
                  {img.isLoading ? (
                    <Box
                      sx={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                      }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <Box
                      component="img"
                      src={base64ToDataUrl(img.base64)}
                      alt={img.originalName}
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  )}
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(img.id);
                    }}
                    sx={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      bgcolor: theme.palette.error.main,
                      color: "white",
                      width: 20,
                      height: 20,
                      border: `2px solid ${theme.palette.background.paper}`,
                      "&:hover": {
                        bgcolor: theme.palette.error.dark,
                        transform: "scale(1.1)",
                      },
                      transition: "all 0.2s ease-in-out",
                      zIndex: 2,
                    }}
                    aria-label="Remove image"
                  >
                    <CloseIcon sx={{ fontSize: 12 }} />
                  </IconButton>
                </Box>
              ))}
            </Stack>
            
            {/* Image info */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip 
                label={`${selectedImages.length}/${MAX_IMAGES} images`}
                size="small"
                variant="outlined"
                color="primary"
              />
              <Chip 
                label={formatFileSize(totalImageSize)}
                size="small"
                variant="outlined"
              />
            </Stack>
          </Box>
        )}

        <TextField
          multiline
          minRows={1}
          maxRows={6}
          variant="standard"
          placeholder={
            isVisionModel 
              ? selectedImages.length > 0 
                ? "Describe what you want to know about these images..."
                : "Ask me anything... (You can upload images or drag & drop!)"
              : "Ask me anything..."
          }
          fullWidth
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          InputProps={inputProps}
          sx={textFieldStyles}
        />

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          multiple
          style={{ display: 'none' }}
        />

        {/* Image upload button - only show for vision models */}
        {isVisionModel && (
          <IconButton
            onClick={handleImageButtonClick}
            sx={imageButtonStyles}
            aria-label="Upload images"
            disabled={selectedImages.length >= MAX_IMAGES}
          >
            <ImageIcon fontSize="small" />
          </IconButton>
        )}

        <IconButton
          onClick={isProcessing ? handleCancel : handleSend}
          disabled={!canSend}
          sx={buttonStyles}
          aria-label={isProcessing ? "Cancel sending" : "Send message"}
        >
          {isProcessing ? (
            <CancelIcon fontSize="small" />
          ) : (
            <ArrowUpwardIcon fontSize="small" />
          )}
        </IconButton>
      </Box>

      {/* Image Preview Modal */}
      <Modal
        open={!!previewImage}
        onClose={closeImagePreview}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 300,
          sx: { bgcolor: "rgba(0, 0, 0, 0.8)" },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            maxWidth: "90vw",
            maxHeight: "90vh",
            outline: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {previewImage && (
            <>
              <Box
                component="img"
                src={previewImage.src}
                alt={previewImage.data.originalName}
                sx={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  objectFit: "contain",
                  borderRadius: 2,
                  boxShadow: `0 8px 32px ${alpha("#000", 0.4)}`,
                }}
              />
              <Typography variant="caption" sx={{ mt: 1, color: "white", textAlign: "center" }}>
                {previewImage.data.originalName} • {formatFileSize(previewImage.data.size)}
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <IconButton
                  onClick={removeImageFromPreview}
                  sx={{
                    bgcolor: theme.palette.error.main,
                    color: "white",
                    "&:hover": {
                      bgcolor: theme.palette.error.dark,
                    },
                  }}
                  aria-label="Remove image"
                >
                  <CloseIcon />
                </IconButton>
                <IconButton
                  onClick={closeImagePreview}
                  sx={{
                    bgcolor: alpha(theme.palette.background.paper, 0.9),
                    color: theme.palette.text.primary,
                    "&:hover": {
                      bgcolor: theme.palette.background.paper,
                    },
                  }}
                  aria-label="Close preview"
                >
                  <CloseIcon />
                </IconButton>
              </Stack>
            </>
          )}
        </Box>
      </Modal>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
