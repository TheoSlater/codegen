import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import { useChat } from "../context/ChatMessagesContext";
import ChatBubble from "./ChatBubble";
import ChatInput from "./ChatInput";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { Virtuoso } from "react-virtuoso";
import CodePanel from "./CodePanel";
import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";

const ChatArea: React.FC = () => {
  const theme = useTheme();
  const { messages, isSending, sendMessage, cancel } = useChat();
  const [input, setInput] = useState("");
  const [code, setCode] = useState<string>("");

  const extractCodeBlocks = (markdown: string, language = "tsx"): string[] => {
    const codeBlocks: string[] = [];
    const tree = unified().use(remarkParse).parse(markdown);

    visit(tree, "code", (node: { type: string; lang?: string | null; value: string }) => {
      if (!language || node.lang === language) {
        codeBlocks.push(node.value);
      }
    });

    return codeBlocks;
  };

  useEffect(() => {
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === "assistant") {
      const codeBlocks = extractCodeBlocks(lastMsg.content, "tsx");
      if (codeBlocks.length > 0 && !isSending) {
        setCode(codeBlocks[0]);
      }
    }
  }, [messages, isSending]);

  const handleSendInput = async (content: string, images?: string[]) => {
    if (!content.trim()) return;
    await sendMessage(content, images);
    setInput("");
  };

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
              itemContent={(index, msg) => {
                const isLast = index === messages.length - 1;
                const isStreaming = isLast && msg.role === "assistant" && isSending;

                return (
                  <ChatBubble
                    key={index}
                    role={msg.role}
                    content={msg.content}
                    chunks={msg.chunks}
                    isStreaming={isStreaming}
                  />
                );
              }}
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
          Powered by AI. Generated content may be false or inaccurate.
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
        <CodePanel code={code} setCode={setCode} />
      </Paper>
    </Box>
  );
};

export default ChatArea;
