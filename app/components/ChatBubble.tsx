import React, { useMemo, memo } from "react";
import {
  Box,
  Typography,
  useTheme,
  Link as MuiLink,
  alpha,
} from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ChunkedMessageRenderer from "./ChunkedMessageRenderer";
import { parseEnhancedMessage } from "../utils/messageParser";
import { ChatMessage } from "../types/types";

interface ChatBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  chunks?: ChatMessage['chunks']; // Optional pre-parsed chunks
  isStreaming?: boolean;
}

const CodeRenderer = ({
  inline,
  children,
  ...props
}: {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  node?: unknown;
}) => {
  const theme = useTheme();

  const codeString = Array.isArray(children)
    ? children.join("")
    : String(children);

  // Strip block-level code from chat bubble rendering
  if (!inline) {
    return null;
  }

  return (
    <Box
      component="code"
      sx={{
        backgroundColor: alpha(theme.palette.text.primary, 0.08),
        color: theme.palette.text.primary,
        px: 0.8,
        py: 0.2,
        borderRadius: 0.5,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
        fontSize: "0.875rem",
        fontWeight: 500,
      }}
      {...props}
    >
      {codeString}
    </Box>
  );
};

const ChatBubble: React.FC<ChatBubbleProps> = ({
  role,
  content,
  chunks,
}) => {
  const theme = useTheme();
  const isUser = role === "user";
  const isSystem = role === "system";

  // Memoize content parsing to avoid reparsing on every render
  const parsed = useMemo(() => parseEnhancedMessage(content), [content]);

  // Handle copy functionality for code chunks
  const handleCopyCode = async (codeContent: string) => {
    try {
      await navigator.clipboard.writeText(codeContent);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // System messages - minimal alert style
  if (isSystem) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: 4,
        }}
      >
        <Box
          sx={{
            backgroundColor: alpha(theme.palette.warning.main, 0.1),
            color: theme.palette.warning.dark,
            px: 2,
            py: 1,
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
            fontSize: "0.875rem",
            fontStyle: "italic",
          }}
        >
          <Typography variant="body2">
            {content}
          </Typography>
        </Box>
      </Box>
    );
  }

  // User messages - simple bubble on the right
  if (isUser) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mb: 3,
        }}
      >
        <Box
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            px: 2.5,
            py: 1.5,
            borderRadius: 2,
            maxWidth: { xs: "85%", sm: "70%", md: "60%" },
            wordBreak: "break-word",
          }}
        >
          <Typography
            variant="body1"
            sx={{ 
              whiteSpace: "pre-wrap",
              lineHeight: 1.5,
            }}
          >
            {content}
          </Typography>
        </Box>
      </Box>
    );
  }

  // Assistant messages - enhanced with chunked rendering
  const shouldUseChunkedRender = chunks && chunks.length > 0;
  
  // If we have pre-parsed chunks, use them
  if (shouldUseChunkedRender) {
    return (
      <Box
        sx={{
          mb: 4,
          maxWidth: "100%",
        }}
      >
        <ChunkedMessageRenderer
          chunks={chunks!}
          onCopyCode={handleCopyCode}
        />
      </Box>
    );
  }
  
  // Otherwise, try to parse the content for enhanced rendering
  if (parsed.hasChunks) {
    return (
      <Box
        sx={{
          mb: 4,
          maxWidth: "100%",
        }}
      >
        <ChunkedMessageRenderer
          chunks={parsed.chunks}
          onCopyCode={handleCopyCode}
        />
      </Box>
    );
  }

  // Assistant messages - no bubble, just clean text
  return (
    <Box
      sx={{
        mb: 4,
        maxWidth: "100%",
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => (
            <Typography 
              variant="h4" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                mt: 3,
                mb: 2,
              }} 
              {...props} 
            />
          ),
          h2: (props) => (
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                mt: 2.5,
                mb: 1.5,
              }} 
              {...props} 
            />
          ),
          h3: (props) => (
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                mt: 2,
                mb: 1,
              }} 
              {...props} 
            />
          ),
          p: (props) => (
            <Typography
              variant="body1"
              paragraph
              sx={{ 
                lineHeight: 1.7,
                mb: 2,
                color: theme.palette.text.primary,
              }}
              {...props}
            />
          ),
          a: ({ href, children, ...props }) => (
            <MuiLink
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              color="primary"
              sx={{ fontWeight: 500 }}
              {...props}
            >
              {children}
            </MuiLink>
          ),
          ul: (props) => (
            <Box
              component="ul"
              sx={{
                pl: 3,
                mb: 2,
                "& li": {
                  mb: 0.5,
                },
              }}
              {...props}
            />
          ),
          ol: (props) => (
            <Box
              component="ol"
              sx={{
                pl: 3,
                mb: 2,
                "& li": {
                  mb: 0.5,
                },
              }}
              {...props}
            />
          ),
          li: (props) => (
            <Typography 
              component="li" 
              variant="body1" 
              sx={{ 
                lineHeight: 1.6,
                color: theme.palette.text.primary,
              }} 
              {...props} 
            />
          ),
          blockquote: (props) => (
            <Box
              component="blockquote"
              sx={{
                borderLeft: `3px solid ${theme.palette.divider}`,
                backgroundColor: alpha(theme.palette.text.primary, 0.03),
                px: 2,
                py: 1,
                ml: 0,
                my: 2,
                fontStyle: "italic",
                color: theme.palette.text.secondary,
              }}
              {...props}
            />
          ),
          code: CodeRenderer,
          pre: (props) => (
            <Box
              component="pre"
              sx={{
                backgroundColor: alpha(theme.palette.text.primary, 0.05),
                p: 2,
                borderRadius: 1,
                overflow: "auto",
                fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
                fontSize: "0.875rem",
                border: `1px solid ${theme.palette.divider}`,
                my: 2,
              }}
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
      
    </Box>
  );
};

export default memo(ChatBubble);