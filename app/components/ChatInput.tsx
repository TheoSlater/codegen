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

  const canSend = !isProcessing && (input.trim() || selectedImages.some((img: ImageData) => !img.isLoading));

  // Memoized styles - bolt.new inspired
  const containerStyles = useMemo(() => ({
    display: "flex",
    flexDirection: "column" as const,
    borderRadius: "12px",
    bgcolor: theme.palette.background.paper,
    border: `1px solid ${isDragOver ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.08)}`,
    position: "relative" as const,
    overflow: "hidden",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: isDragOver 
      ? `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}` 
      : "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    "&:hover": {
      borderColor: alpha(theme.palette.text.primary, 0.12),
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    },
    "&:focus-within": {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
    },
  }), [theme, isDragOver]);

  const inputContainerStyles = useMemo(() => ({
    display: "flex",
    alignItems: "flex-end",
    px: 3,
    py: 2,
    gap: 1,
    minHeight: 56,
  }), []);

  const textFieldStyles = useMemo(() => ({
    flex: 1,
    "& .MuiInputBase-root": {
      fontSize: "15px",
      lineHeight: 1.5,
      color: theme.palette.text.primary,
      fontFamily: theme.typography.fontFamily,
      fontWeight: 400,
    },
    "& .MuiInputBase-input": {
      padding: 0,
      "&::placeholder": {
        color: theme.palette.text.secondary,
        opacity: 0.7,
        fontWeight: 400,
      },
    },
  }), [theme]);

  const sendButtonStyles = useMemo(() => ({
    width: 32,
    height: 32,
    minWidth: 32,
    bgcolor: canSend ? theme.palette.primary.main : alpha(theme.palette.text.primary, 0.06),
    color: canSend ? theme.palette.primary.contrastText : theme.palette.text.disabled,
    borderRadius: "8px",
    transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      bgcolor: canSend 
        ? theme.palette.primary.dark 
        : alpha(theme.palette.text.primary, 0.08),
      transform: canSend ? "scale(1.05)" : "none",
    },
    "&:active": {
      transform: canSend ? "scale(0.95)" : "none",
    },
    "&:disabled": {
      bgcolor: alpha(theme.palette.text.primary, 0.04),
      color: theme.palette.text.disabled,
    },
  }), [theme, canSend]);

  const imageButtonStyles = useMemo(() => ({
    width: 32,
    height: 32,
    minWidth: 32,
    borderRadius: "8px",
    bgcolor: selectedImages.length > 0 
      ? alpha(theme.palette.primary.main, 0.1) 
      : "transparent",
    color: selectedImages.length > 0 
      ? theme.palette.primary.main 
      : theme.palette.text.secondary,
    border: "none",
    transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      bgcolor: alpha(theme.palette.primary.main, 0.08),
      color: theme.palette.primary.main,
      transform: "scale(1.05)",
    },
    "&:active": {
      transform: "scale(0.95)",
    },
    "&:disabled": {
      bgcolor: "transparent",
      color: theme.palette.text.disabled,
    },
  }), [selectedImages.length, theme]);

  const inputProps = useMemo(() => ({ 
    disableUnderline: true,
    sx: { fontSize: "inherit" }
  }), []);

  const placeholderText = useMemo(() => {
    if (isVisionModel) {
      return selectedImages.length > 0 
        ? "Describe what you want to know about these images..."
        : "Ask me anything or upload images...";
    }
    return "Ask me anything...";
  }, [isVisionModel, selectedImages.length]);

  return (
    <>
      <Box 
        sx={containerStyles}
        onDragOver={isVisionModel ? handleDragOver : undefined}
        onDragLeave={isVisionModel ? handleDragLeave : undefined}
        onDrop={isVisionModel ? handleDrop : undefined}
      >
        <DragOverlay isDragOver={isDragOver} isVisionModel={isVisionModel} />

        {/* Image thumbnails */}
        {selectedImages.length > 0 && (
          <Box sx={{ px: 3, pt: 2 }}>
            <ImageThumbnails
              selectedImages={selectedImages}
              onImageClick={openImagePreview}
              onRemoveImage={removeImage}
              maxImages={MAX_IMAGES}
            />
          </Box>
        )}

        {/* Input container */}
        <Box sx={inputContainerStyles}>
          <TextField
            multiline
            minRows={1}
            maxRows={8}
            variant="standard"
            placeholder={placeholderText}
            fullWidth
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            InputProps={inputProps}
            sx={textFieldStyles}
          />

          {/* Action buttons */}
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            {/* Image upload button - only show for vision models */}
            {isVisionModel && (
              <IconButton
                onClick={handleImageButtonClick}
                sx={imageButtonStyles}
                aria-label="Upload images"
                disabled={selectedImages.length >= MAX_IMAGES}
                size="small"
              >
                <ImageIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}

            {/* Send/Cancel button */}
            <IconButton
              onClick={isProcessing ? handleCancel : handleSend}
              disabled={!canSend && !isProcessing}
              sx={sendButtonStyles}
              aria-label={isProcessing ? "Cancel sending" : "Send message"}
              size="small"
            >
              {isProcessing ? (
                <CancelIcon sx={{ fontSize: 18 }} />
              ) : (
                <ArrowUpwardIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </Box>
        </Box>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          multiple
          style={{ display: 'none' }}
        />
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
          sx={{ 
            width: '100%',
            borderRadius: "8px",
            "& .MuiAlert-message": {
              fontSize: "14px",
            },
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;