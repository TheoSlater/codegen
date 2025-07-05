"use client";

import React from "react";

import {
  useTheme,
  Box,
  TextField,
  IconButton,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CancelIcon from "@mui/icons-material/Stop"; // square icon
import { useRef, useCallback, useMemo } from "react";

interface ChatInputProps {
  onSend: (message: string, signal: AbortSignal) => Promise<void>;
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
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setInput("");

    try {
      await onSend(trimmed, controller.signal);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Send aborted");
      } else {
        console.error("Send error:", error);
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [input, isProcessing, onSend, setInput]);

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
    pr: 6,
    fontSize: "1rem",
  }), []);

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

  const inputProps = useMemo(() => ({ disableUnderline: true }), []);

  return (
    <Box sx={containerStyles}>
      <TextField
        multiline
        minRows={1}
        maxRows={6}
        variant="standard"
        placeholder="Ask me anything..."
        fullWidth
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        InputProps={inputProps}
        sx={textFieldStyles}
      />

      <IconButton
        onClick={isProcessing ? handleCancel : handleSend}
        disabled={!isProcessing && !input.trim()}
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
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
