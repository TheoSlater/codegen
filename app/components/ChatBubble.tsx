import React from "react";
import {
  Box,
  Typography,
  useTheme,
  Link as MuiLink,
  alpha,
} from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
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
  const isDark = theme.palette.mode === "dark";

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
        backgroundColor: isDark
          ? "rgba(255,255,255,0.08)"
          : "rgba(0,0,0,0.05)",
        px: 0.5,
        py: 0.2,
        borderRadius: 1,
        fontFamily: "monospace",
        fontSize: "0.875rem",
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
  isStreaming = false,
}) => {
  const theme = useTheme();
  const isUser = role === "user";
  const isAssistant = role === "assistant";
  const isSystem = role === "system";

  // Background color per role
  const backgroundColor = isSystem
    ? theme.palette.mode === "dark"
      ? alpha(theme.palette.warning.light, 0.15)
      : alpha(theme.palette.warning.light, 0.3)
    : isUser
    ? theme.palette.mode === "dark"
      ? alpha(theme.palette.primary.light, 0.12)
      : alpha(theme.palette.primary.light, 0.3)
    : theme.palette.mode === "dark"
    ? "rgba(255, 255, 255, 0.06)"
    : theme.palette.background.paper;

  // Border color per role
  const borderColor = isSystem
    ? theme.palette.warning.main
    : isUser
    ? theme.palette.mode === "dark"
      ? alpha(theme.palette.primary.light, 0.2)
      : "transparent"
    : theme.palette.mode === "dark"
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.1)";

  const justifyContent = isUser ? "flex-end" : isSystem ? "center" : "flex-start";
  const fontStyle = isStreaming && isAssistant ? "italic" : "normal";
  const opacity = isStreaming && isAssistant ? 0.95 : 1;

  // Render system messages differently
  if (isSystem) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent,
          mb: 2,
          animation: "fadeInUp 0.3s ease-out",
          "@keyframes fadeInUp": {
            from: { opacity: 0, transform: "translateY(8px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        <Box
          sx={{
            bgcolor: backgroundColor,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            border: `1px solid ${borderColor}`,
            maxWidth: { xs: "95%", sm: "85%", md: "70%" },
            wordBreak: "break-word",
            boxShadow: 1,
            fontStyle: "italic",
            color: theme.palette.warning.dark,
          }}
        >
          <Typography
            variant="body2"
            sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          >
            {content}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent,
        mb: 2,
        animation: "fadeInUp 0.3s ease-out",
        "@keyframes fadeInUp": {
          from: { opacity: 0, transform: "translateY(8px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Box
        sx={{
          bgcolor: backgroundColor,
          px: 2,
          py: 1.5,
          borderRadius: 2,
          border: `1px solid ${borderColor}`,
          maxWidth: { xs: "95%", sm: "85%", md: "70%" },
          wordBreak: "break-word",
          boxShadow: 1,
          fontStyle,
          opacity,
          position: "relative",
        }}
      >
        {isUser ? (
          <Typography
            variant="body1"
            sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
          >
            {content}
          </Typography>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: (props) => (
                <Typography variant="h4" gutterBottom {...props} />
              ),
              h2: (props) => (
                <Typography variant="h5" gutterBottom {...props} />
              ),
              h3: (props) => (
                <Typography variant="h6" gutterBottom {...props} />
              ),
              p: (props) => (
                <Typography
                  variant="body2"
                  paragraph
                  sx={{ mt: 0.75, mb: 0.75 }}
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
                  {...props}
                >
                  {children}
                </MuiLink>
              ),
              li: (props) => (
                <li>
                  <Typography variant="body2" component="span" {...props} />
                </li>
              ),
              blockquote: (props) => (
                <Box
                  component="blockquote"
                  sx={{
                    borderLeft: `4px solid ${theme.palette.divider}`,
                    backgroundColor: alpha(theme.palette.text.primary, 0.04),
                    px: 2,
                    py: 1,
                    ml: 0,
                    fontStyle: "italic",
                    color: theme.palette.text.secondary,
                    borderRadius: 1,
                  }}
                  {...props}
                />
              ),
              code: CodeRenderer,
            }}
          >
            {content}
          </ReactMarkdown>
        )}
        {isStreaming && (
          <Box
            component="span"
            sx={{
              display: "inline-block",
              width: "1ch",
              height: "1em",
              backgroundColor: theme.palette.text.primary,
              ml: 0.5,
              animation: "blink 1.2s infinite",
              "@keyframes blink": {
                "0%": { opacity: 1 },
                "50%": { opacity: 0 },
                "100%": { opacity: 1 },
              },
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default ChatBubble;