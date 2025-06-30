// components/ChatArea.tsx
import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import { useChat } from "../../context/ChatMessagesContext";
import ChatBubble from "../test/ChatBubble_TEST";
import ChatInput from "../ChatInput";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { Virtuoso } from "react-virtuoso";
import CodePanel from "./CodePanel";

const ChatArea: React.FC = () => {
  const theme = useTheme();
  const { messages, isSending, sendMessage, cancel } = useChat();
  const [input, setInput] = useState("");
  const [code, setCode] = useState<string>("");
  const [pendingFilename, setPendingFilename] = useState<string | null>(null);

  useEffect(() => {
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];

    if (lastMsg.role === "assistant") {
      const codeBlockMatch = lastMsg.content.match(/```tsx?\n([\s\S]*?)```/);
      const inProgressMatch = lastMsg.content.match(/```tsx?\n([\s\S]*)$/); // no closing ```

      if (codeBlockMatch && !isSending) {
        setCode(codeBlockMatch[1]);
        setPendingFilename(null);
      } else if (inProgressMatch && isSending) {
        setPendingFilename("App.tsx"); // TODO: Improve filename extraction
      } else {
        setPendingFilename(null);
      }
    }
  }, [messages, isSending]);

  const handleSendInput = async (content: string) => {
    if (!content.trim()) return;
    await sendMessage(content);
    setInput("");
  };

  return (
    <Box display="flex" height="100dvh" width="100%" gap={2}>
      {/* Left: Chat Panel */}
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
          maxWidth: "15%",
        }}
      >
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
              style={{ height: "100%", width: "100%", gap: 1.5 }}
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

      {/* Right: Code Panel */}
      <Paper
        elevation={3}
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          borderRadius: "10px",
          p: 2,
          overflow: "hidden",
          bgcolor: "background.paper",
          position: "relative",
        }}
      >
        <CodePanel
          code={code}
          setCode={setCode}
          pendingFile={pendingFilename}
        />
      </Paper>
    </Box>
  );
};

export default ChatArea;
