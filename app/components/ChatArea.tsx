"use client";

import { useState, useMemo } from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import { useChat } from "../context/ChatMessagesContext";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { Virtuoso } from "react-virtuoso";
import dynamic from "next/dynamic";

const SandpackPreview = dynamic(() => import("./SandpackPreview"), {
  ssr: false,
});

export default function ChatArea() {
  const theme = useTheme();
  const { messages, isSending, sendMessage, cancel } = useChat();
  const [input, setInput] = useState("");

  const handleSendInput = async (content: string) => {
    if (!content.trim()) return;
    await sendMessage(content);
    setInput("");
  };

  const lastCode = useMemo(() => {
    const reversed = [...messages].reverse();
    const lastAssistant = reversed.find((m) => m.role === "assistant");
    if (!lastAssistant) return "";
    const text = lastAssistant.content;
    const match = /```(?:tsx|jsx|js|ts)?\n([\s\S]*?)```/.exec(text);
    return match ? match[1].trim() : text.trim();
  }, [messages]);

  return (
    <Box display="flex" height="100%" width="100%" gap={2}>
      {/* Left: Chat */}
      <Paper
        elevation={3}
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          borderRadius: "10px",
          p: 2,
          overflow: "hidden",
          bgcolor: "background.main",
          minWidth: "50%",
        }}
      >
        {/* Messages */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: messages.length === 0 ? "center" : "flex-start",
            overflow: "hidden",
            pr: 1,
            mb: 2,
          }}
        >
          {messages.length === 0 ? (
            <Box
              sx={{
                maxWidth: 450,
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
              <Typography variant="h4">Welcome to CodeGen</Typography>
              <Typography
                variant="body2"
                sx={{ mt: 1, color: "text.secondary" }}
              >
                Build smarter, ship faster with instant code generation.
              </Typography>
            </Box>
          ) : (
            <Virtuoso
              style={{ height: "100%", width: "100%" }}
              data={messages}
              itemContent={(index, msg) => {
                const isLast = index === messages.length - 1;
                const isStreaming =
                  isLast && msg.role === "assistant" && isSending;

                return (
                  <ChatBubble
                    key={index}
                    role={msg.role}
                    content={msg.content}
                    isStreaming={isStreaming}
                  />
                );
              }}
              followOutput={isSending}
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
          Powered by AI. Generated content may be false or inaccurate.
        </Typography>
      </Paper>

      {/* Right: Preview */}
      <Paper
        elevation={3}
        sx={{
          width: "50%",
          display: "flex",
          flexDirection: "column",
          borderRadius: "10px",
          p: 2,
          overflow: "auto",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h6" fontWeight={600} mb={1}>
          Preview
        </Typography>

        {lastCode ? (
          <SandpackPreview code={lastCode} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            Nothing to preview yet. Generate some code to get started.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
