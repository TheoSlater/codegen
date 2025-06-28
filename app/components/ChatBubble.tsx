import React from "react";
import { Box, Typography, useTheme, Link as MuiLink } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Highlight, Language, themes } from "prism-react-renderer";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

const CodeRenderer = ({
  inline,
  className,
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
  const prismTheme = isDark ? themes.vsDark : themes.vsLight;

  // Parse language safely from className (e.g., "language-js")
  const languageMatch = className?.match(/language-(\w+)/);
  const language =
    (languageMatch ? (languageMatch[1] as Language) : "text") || "text";

  // Extract code string from children (usually an array of strings)
  const codeString = Array.isArray(children)
    ? children.join("")
    : String(children);

  if (inline) {
    // Inline code style (no prism highlighting)
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
  }

  // Block code with syntax highlighting from prism-react-renderer
  return (
    <Highlight theme={prismTheme} code={codeString.trim()} language={language}>
      {({
        className: highlightClassName,
        style,
        tokens,
        getLineProps,
        getTokenProps,
      }) => (
        <Box
          component="pre"
          className={highlightClassName}
          sx={{
            ...style,
            backgroundColor: isDark ? "#1e1e1e" : "#f4f4f4",
            padding: 3,
            borderRadius: "12px",
            overflowX: "auto",
            fontFamily: "monospace",
            fontSize: "0.875rem",
            whiteSpace: "pre",
            margin: 0,
          }}
          {...props}
          tabIndex={0}
        >
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </Box>
      )}
    </Highlight>
  );
};

export default function ChatBubble({
  role,
  content,
  isStreaming,
}: ChatBubbleProps) {
  const theme = useTheme();
  const isUser = role === "user";

  // Background color logic based on user role and dark/light mode
  const backgroundColor = isUser
    ? theme.palette.mode === "dark"
      ? theme.palette.primary.light + "20"
      : theme.palette.primary.light
    : theme.palette.mode === "dark"
    ? "rgba(255, 255, 255, 0.06)"
    : theme.palette.background.paper;

  // Border color logic
  const borderColor = isUser
    ? theme.palette.mode === "dark"
      ? theme.palette.primary.light + "33"
      : "transparent"
    : theme.palette.mode === "dark"
    ? "rgba(255, 255, 255, 0.1)"
    : "transparent";

  return (
    <Box
      sx={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        bgcolor: backgroundColor,
        px: 2,
        py: 1,
        mb: 2,
        borderRadius: theme.shape.borderRadius,
        border: `1px solid ${borderColor}`,
        maxWidth: "70%",
        wordBreak: "break-word",
        boxShadow: 2,
        fontStyle: isStreaming ? "italic" : "normal",
        opacity: isStreaming ? 0.8 : 1,
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
            h1: (props) => <Typography variant="h4" gutterBottom {...props} />,
            h2: (props) => <Typography variant="h5" gutterBottom {...props} />,
            h3: (props) => <Typography variant="h6" gutterBottom {...props} />,
            p: (props) => <Typography variant="body1" paragraph {...props} />,
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
                  pl: 2,
                  ml: 0,
                  color: theme.palette.text.secondary,
                  fontStyle: "italic",
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
    </Box>
  );
}
