"use client";

import React, { useRef, useCallback, useMemo, useState } from "react";
import {
  useTheme,
  Box,
  TextField,
  IconButton,
  alpha,
  Snackbar,
  Alert,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CancelIcon from "@mui/icons-material/Stop";
import ImageIcon from "@mui/icons-material/Image";
import { useModel } from "../context/ModelContext";
import { useImageUpload, ImageData } from "../hooks/useImageUpload";
import DragOverlay from "./DragOverlay";
import ImageThumbnails from "./ImageThumbnails";
import ImagePreviewModal from "./ImagePreviewModal";

interface ChatInputProps {
  onSend: (message: string, images?: string[]) => Promise<void>;
  input: string;
  setInput: (value: string) => void;
  disabled?: boolean;
  isProcessing: boolean;
  cancel: () => void;
}

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
  
  // Use the image upload hook
  const {
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
  } = useImageUpload();

  const [previewImage, setPreviewImage] = useState<{ src: string; index: number; data: ImageData } | null>(null);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    const readyImages = selectedImages.filter(img => !img.isLoading);
    
    if ((!trimmed && readyImages.length === 0) || isProcessing) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    const imagesToSend = readyImages.map(img => img.base64);
    setInput("");
    clearImages();

    try {
      await onSend(trimmed, imagesToSend.length > 0 ? imagesToSend : undefined);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Send aborted");
      } else {
        console.error("Send error:", error);
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [input, isProcessing, onSend, setInput, selectedImages, clearImages]);

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

  // Memoized styles
  const containerStyles = useMemo(() => ({
    display: "flex",
    flexDirection: "column" as const,
    borderRadius: theme.shape.borderRadius,
    bgcolor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)",
    border: `1px solid ${isDragOver ? theme.palette.primary.main : theme.palette.divider}`,
    px: 2,
    py: 1.5,
    position: "relative" as const,
    overflow: "hidden",
    transition: "border-color 0.2s ease-in-out",
  }), [theme.shape.borderRadius, theme.palette.mode, theme.palette.primary.main, theme.palette.divider, isDragOver]);

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
    borderRadius: theme.shape.borderRadius,
  }), [isProcessing, theme.palette.primary.main, theme.palette.primary.contrastText, theme.palette.primary.dark, theme.shape.borderRadius]);

  const imageButtonStyles = useMemo(() => ({
    position: "absolute" as const,
    right: 54,
    bottom: 12,
    borderRadius: theme.shape.borderRadius,
    bgcolor: theme.palette.background.paper,
    color: selectedImages.length > 0 ? theme.palette.primary.main : theme.palette.text.secondary,
    border: `1px solid ${selectedImages.length > 0 ? theme.palette.primary.main : theme.palette.divider}`,
    "&:hover": {
      bgcolor: alpha(theme.palette.primary.main, 0.04),
      borderColor: theme.palette.primary.main,
      color: theme.palette.primary.main,
    },
    "&:disabled": {
      bgcolor: theme.palette.grey[100],
      color: theme.palette.grey[400],
      borderColor: theme.palette.grey[300],
    },
    width: 36,
    height: 36,
    transition: "all 0.2s ease-in-out",
  }), [selectedImages.length, theme.palette.background.paper, theme.palette.divider, theme.palette.grey, theme.palette.primary.main, theme.palette.text.secondary, theme.shape.borderRadius]);

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
        <DragOverlay isDragOver={isDragOver} isVisionModel={isVisionModel} />

        <ImageThumbnails
          selectedImages={selectedImages}
          onImageClick={openImagePreview}
          onRemoveImage={removeImage}
          maxImages={MAX_IMAGES}
        />

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
      <ImagePreviewModal
        previewImage={previewImage}
        onClose={closeImagePreview}
        onRemove={removeImageFromPreview}
      />

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={clearError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={clearError} 
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
