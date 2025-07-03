"use client";

import type React from "react";

import {
  useTheme,
  Box,
  TextField,
  IconButton,

} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CancelIcon from "@mui/icons-material/Stop"; // square icon
import {  useRef } from "react";

interface ChatInputProps {
  onSend: (message: string, signal: AbortSignal) => Promise<void>;
  input: string;
  setInput: (value: string) => void;
  disabled?: boolean;
  isProcessing: boolean;
  cancel: () => void;
}

export default function ChatInput({
  onSend,
  input,
  setInput,
  isProcessing,
  cancel,
}: ChatInputProps) {
  const theme = useTheme();
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSend = async () => {
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
  };

  // When cancel is triggered, abort internal controller AND notify parent
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    cancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
        bgcolor:
          theme.palette.mode === "dark"
            ? "rgba(255, 255, 255, 0.05)"
            : "rgba(0, 0, 0, 0.03)",
        border: `1px solid ${theme.palette.divider}`,
        px: 2,
        py: 1.5,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <TextField
        multiline
        minRows={1}
        maxRows={6}
        variant="standard"
        placeholder="Ask me anything..."
        fullWidth
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        InputProps={{ disableUnderline: true }}
        sx={{
          pr: 6,
          fontSize: "1rem",
        }}
      />

      <IconButton
        onClick={isProcessing ? handleCancel : handleSend}
        disabled={!isProcessing && !input.trim()}
        sx={{
          position: "absolute",
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
        }}
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
}
