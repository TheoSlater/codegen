"use client";

import type React from "react";

import {
  useTheme,
  Box,
  TextField,
  IconButton,
  Popover,
  Stack,
  Button,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CancelIcon from "@mui/icons-material/Stop"; // square icon
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import { useState, useRef } from "react";

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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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

  const handleToolsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const open = Boolean(anchorEl);
  const id = open ? "tools-popover" : undefined;

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

      <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 1 }}>
        <Button
          onClick={handleToolsClick}
          startIcon={<TuneOutlinedIcon />}
          sx={{
            textTransform: "none",
            color: theme.palette.text.primary,
            borderRadius: "12px",
            px: 1.5,
            py: 0.5,
            minHeight: 0,
          }}
        >
          Tools
        </Button>
      </Box>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            mt: 1,
            p: 2,
            borderRadius: "12px",
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: 3,
            minWidth: 200,
          },
        }}
      >
        <Stack spacing={1}>
          <Button
            fullWidth
            variant="outlined"
            size="small"
            sx={{
              justifyContent: "flex-start",
              borderRadius: "10px",
              textTransform: "none",
            }}
            onClick={() => {
              setInput(input.trim() + " /search");
              setAnchorEl(null);
            }}
          >
            Search the web
          </Button>
        </Stack>
      </Popover>
    </Box>
  );
}
