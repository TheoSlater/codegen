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
          ? alpha(theme.palette.primary.main, 0.15)
          : alpha(theme.palette.primary.main, 0.08),
        color: theme.palette.primary.main,
        px: 1,
        py: 0.3,
        borderRadius: 1.5,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: "0.85rem",
        fontWeight: 500,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
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
      : alpha(theme.palette.warning.light, 0.1)
    : isUser
    ? theme.palette.mode === "dark"
      ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.secondary.main, 0.2)})`
      : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.secondary.main, 0.08)})`
    : theme.palette.mode === "dark"
    ? alpha(theme.palette.background.paper, 0.8)
    : alpha(theme.palette.background.paper, 0.9);

  // Border color per role
  const borderColor = isSystem
    ? alpha(theme.palette.warning.main, 0.3)
    : isUser
    ? alpha(theme.palette.primary.main, 0.2)
    : alpha(theme.palette.divider, 0.1);

  const justifyContent = isUser ? "flex-end" : isSystem ? "center" : "flex-start";
  const fontStyle = isStreaming && isAssistant ? "normal" : "normal";
  const opacity = isStreaming && isAssistant ? 0.95 : 1;

  // Render system messages differently
  if (isSystem) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent,
          mb: 3,
          animation: "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          "@keyframes fadeInUp": {
            from: { opacity: 0, transform: "translateY(12px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        <Box
          sx={{
            background: backgroundColor,
            px: 3,
            py: 2,
            borderRadius: 2.5,
            border: `1px solid ${borderColor}`,
            maxWidth: { xs: "95%", sm: "85%", md: "75%" },
            wordBreak: "break-word",
            boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.15)}`,
            fontStyle: "italic",
            color: theme.palette.warning.dark,
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography
            variant="body2"
            sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6 }}
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
        mb: 3,
        animation: "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "@keyframes fadeInUp": {
          from: { opacity: 0, transform: "translateY(12px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Box
        sx={{
          background: backgroundColor,
          px: 3,
          py: 2.5,
          borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
          border: `1px solid ${borderColor}`,
          maxWidth: { xs: "95%", sm: "85%", md: "75%" },
          wordBreak: "break-word",
          boxShadow: isUser 
            ? `0 4px 16px ${alpha(theme.palette.primary.main, 0.2)}`
            : `0 4px 16px ${alpha(theme.palette.common.black, 0.08)}`,
          fontStyle,
          opacity,
          position: "relative",
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: isUser 
              ? `0 6px 20px ${alpha(theme.palette.primary.main, 0.25)}`
              : `0 6px 20px ${alpha(theme.palette.common.black, 0.12)}`,
          }
        }}
      >
        {isUser ? (
          <Typography
            variant="body1"
            sx={{ 
              whiteSpace: "pre-wrap", 
              wordBreak: "break-word",
              lineHeight: 1.6,
              fontWeight: 500,
            }}
          >
            {content}
          </Typography>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: (props) => (
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }} {...props} />
              ),
              h2: (props) => (
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }} {...props} />
              ),
              h3: (props) => (
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }} {...props} />
              ),
              p: (props) => (
                <Typography
                  variant="body1"
                  paragraph
                  sx={{ mt: 0.5, mb: 1, lineHeight: 1.7, fontWeight: 400 }}
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
              li: (props) => (
                <li style={{ marginBottom: '4px' }}>
                  <Typography variant="body1" component="span" sx={{ lineHeight: 1.6 }} {...props} />
                </li>
              ),
              blockquote: (props) => (
                <Box
                  component="blockquote"
                  sx={{
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    px: 2.5,
                    py: 1.5,
                    ml: 0,
                    fontStyle: "italic",
                    color: theme.palette.text.secondary,
                    borderRadius: 1,
                    my: 2,
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
              width: "2px",
              height: "1.2em",
              backgroundColor: theme.palette.primary.main,
              ml: 0.5,
              borderRadius: 1,
              animation: "blink 1s infinite",
              "@keyframes blink": {
                "0%": { opacity: 1 },
                "50%": { opacity: 0.3 },
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