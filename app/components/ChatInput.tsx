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
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CancelIcon from "@mui/icons-material/Stop";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";
import { useRef, useCallback, useMemo, useState } from "react";
import { useModel } from "../context/ModelContext";
import Avatar from "@mui/material/Avatar";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<{ src: string; index: number } | null>(null);

  // Convert file to base64
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/...;base64, prefix for Ollama
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          const base64 = await fileToBase64(file);
          newImages.push(base64);
        } catch (error) {
          console.error('Error converting image to base64:', error);
        }
      }
    }

    setSelectedImages(prev => [...prev, ...newImages]);
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [fileToBase64]);

  const removeImage = useCallback((index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const imagesToSend = [...selectedImages];
    setInput("");
    setSelectedImages([]);

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
  }, [input, isProcessing, onSend, setInput, selectedImages]);

  const handleImageButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // When cancel is triggered, abort internal controller AND notify parent
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

  // Helper to convert base64 to data URL for preview
  const base64ToDataUrl = (base64: string) => `data:image/*;base64,${base64}`;

  // Memoized styles to prevent re-creation
  const containerStyles = useMemo(() => ({
    display: "flex",
    flexDirection: "column" as const,
    borderRadius: "12px",
    bgcolor:
      theme.palette.mode === "dark"
        ? "rgba(255, 255, 255, 0.05)"
        : "rgba(0, 0, 0, 0.03)",
    border: `1px solid ${theme.palette.divider}`,
    px: 2,
    py: 1.5,
    position: "relative" as const,
    overflow: "hidden",
  }), [theme.palette.mode, theme.palette.divider]);

  const textFieldStyles = useMemo(() => ({
    pr: isVisionModel ? 12 : 6, // More space when image button is visible
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
    right: 54, // To the left of the send button
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

  const openImagePreview = useCallback((img: string, index: number) => {
    setPreviewImage({ src: base64ToDataUrl(img), index });
  }, []);

  const closeImagePreview = useCallback(() => {
    setPreviewImage(null);
  }, []);

  const removeImageFromPreview = useCallback(() => {
    if (previewImage) {
      removeImage(previewImage.index);
      closeImagePreview();
    }
  }, [previewImage, removeImage, closeImagePreview]);

  return (
    <>
      <Box sx={containerStyles}>
        {/* Image preview thumbnails */}
        {selectedImages.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {selectedImages.map((img, index) => (
                <Box
                  key={index}
                  sx={{
                    position: "relative",
                    width: 56,
                    height: 56,
                    borderRadius: 2.5,
                    overflow: "hidden",
                    border: `2px solid ${theme.palette.primary.main}`,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                    transition: "all 0.2s ease-in-out",
                    cursor: "pointer",
                    "&:hover": {
                      transform: "scale(1.05)",
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                    },
                  }}
                  onClick={() => openImagePreview(img, index)}
                >
                  <Box
                    component="img"
                    src={base64ToDataUrl(img)}
                    alt={`preview-${index}`}
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
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
                : "Ask me anything... (You can upload images too!)"
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
          >
            <ImageIcon fontSize="small" />
          </IconButton>
        )}

        <IconButton
          onClick={isProcessing ? handleCancel : handleSend}
          disabled={!isProcessing && !input.trim() && selectedImages.length === 0}
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
                alt="Full preview"
                sx={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  objectFit: "contain",
                  borderRadius: 2,
                  boxShadow: `0 8px 32px ${alpha("#000", 0.4)}`,
                }}
              />
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
    </>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
