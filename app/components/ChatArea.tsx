import React, { useState, useCallback, memo } from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import { useChat } from "../context/ChatMessagesContext";
import { ChatMessage } from "../types/types";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { Virtuoso } from "react-virtuoso";
import CodePanel from "./CodePanel";

const ChatArea: React.FC = () => {
  const theme = useTheme();
  const { messages, isSending, sendMessage, cancel, code, setCode } = useChat();
  const [input, setInput] = useState("");

  const handleSendInput = useCallback(async (content: string, images?: string[]) => {
    if (!content.trim()) return;
    await sendMessage(content, images);
    setInput("");
  }, [sendMessage]);

  // Memoized item renderer for Virtuoso to prevent unnecessary re-renders
  const itemRenderer = useCallback((index: number, msg: ChatMessage) => {
    const isLast = index === messages.length - 1;
    const isStreaming = isLast && msg.role === "assistant" && isSending;

    return (
      <ChatBubble
        key={`${index}-${msg.role}`}
        role={msg.role}
        content={msg.content}
        chunks={msg.chunks}
        isStreaming={isStreaming}
      />
    );
  }, [messages.length, isSending]);

  return (
    <Box display="flex" height="100dvh" width="100%" gap={2} overflow="hidden">
      {/* Left: Chat Panel */}
      <Box
        sx={{
          flex: 0.6,
          display: "flex",
          flexDirection: "column",
          borderRadius: "10px",
          p: 2,
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: messages.length === 0 ? "center" : "flex-start",
            pr: 1,
            mb: 2,
          }}
        >
          {messages.length === 0 ? (
            <Box
              sx={{
                mx: "auto",
                textAlign: "center",
                px: 2,
                userSelect: "none",
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  borderRadius: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                  mx: "auto",
                }}
              >
                <AutoAwesomeIcon sx={{ color: "white", fontSize: 32 }} />
              </Box>
              <Typography variant="h4">Welcome to Stak</Typography>
              <Typography
                variant="body2"
                sx={{ mt: 1, color: "text.secondary" }}
              >
                Build smarter, ship faster with instant code generation.
              </Typography>
            </Box>
          ) : (
            <Virtuoso
              style={{ flex: 1, height: "100%", width: "100%" }}
              data={messages}
              itemContent={itemRenderer}
              followOutput="smooth"
              alignToBottom
            />
          )}
        </Box>

        <ChatInput
          input={input}
          setInput={setInput}
          onSend={handleSendInput}
          cancel={cancel}
          isProcessing={isSending}
          disabled={isSending}
        />

        <Typography
          fontSize={12}
          textAlign="center"
          mt={1.5}
          color="text.secondary"
        >
          Powered by Kernl AI. Generated content may be false or inaccurate.
        </Typography>
      </Box>

      {/* Right: Code Panel */}
      <Paper
        elevation={3}
        sx={{
          flex: 1.4,
          display: "flex",
          flexDirection: "column",
          borderRadius: "10px",
          p: 0,
          overflow: "hidden",
          bgcolor: "background.paper",
          position: "relative",
          border: "none",
          minHeight: 0,
        }}
      >
        <CodePanel code={code} setCode={setCode} isSending={isSending} />
      </Paper>
    </Box>
  );
};

export default memo(ChatArea);
