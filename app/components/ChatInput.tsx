"use client";

import React, { useRef, useCallback, useMemo  } from "react";
import {
  useTheme,
  Box,
  TextField,
  IconButton,
  alpha,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CancelIcon from "@mui/icons-material/Stop";



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
  const abortControllerRef = useRef<AbortController | null>(null);
  


  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    
    if ((!trimmed) || isProcessing) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    setInput("");

    try {
      await onSend(trimmed);
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



  const canSend = !isProcessing && (input.trim());

  // Memoized styles - bolt.new inspired
  const containerStyles = useMemo(() => ({
    display: "flex",
    flexDirection: "column" as const,
    borderRadius: "12px",
    bgcolor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.primary.main}`,
    position: "relative" as const,
    overflow: "hidden",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
    "&:hover": {
      borderColor: alpha(theme.palette.text.primary, 0.12),
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    },
    "&:focus-within": {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
    },
  }), [theme]);

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


  const inputProps = useMemo(() => ({ 
    disableUnderline: true,
    sx: { fontSize: "inherit" }
  }), []);

  const placeholderText = "Generate anything..."


  return (
    <>
      <Box 
        sx={containerStyles}
      >


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

      </Box>

    </>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;