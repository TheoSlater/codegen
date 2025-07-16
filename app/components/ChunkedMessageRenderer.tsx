import React, { memo } from 'react';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeFileCard from './CodeFileCard';
import { ChatRenderChunk } from '../types/types';

interface ChunkedMessageRendererProps {
  chunks: ChatRenderChunk[];
  onCopyCode?: (content: string) => void;
}

const ChunkedMessageRenderer: React.FC<ChunkedMessageRendererProps> = ({
  chunks,
  onCopyCode,
}) => {
  const theme = useTheme();

  const renderChunk = (chunk: ChatRenderChunk) => {
    switch (chunk.type) {
      case 'code-file':
        return (
          <CodeFileCard
            key={chunk.id}
            chunk={chunk}
            onCopy={onCopyCode}
          />
        );

      case 'command':
        return (
          <Box
            key={chunk.id}
            sx={{
              my: 2,
              p: 2,
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              borderRadius: 2,
              borderLeft: `4px solid ${theme.palette.primary.main}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                mb: 1,
                display: 'block',
              }}
            >
              Terminal Command
            </Typography>
            <Box
              component="pre"
              sx={{
                fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
                fontSize: '0.875rem',
                margin: 0,
                padding: 0,
                color: theme.palette.text.primary,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              <code>{chunk.content}</code>
            </Box>
          </Box>
        );

      case 'file-tree':
        return (
          <Box
            key={chunk.id}
            sx={{
              my: 2,
              p: 2,
              bgcolor: alpha(theme.palette.background.paper, 0.4),
              border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
              borderRadius: 2,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                mb: 1,
                display: 'block',
              }}
            >
              File Structure
            </Typography>
            <Box
              component="pre"
              sx={{
                fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
                fontSize: '0.875rem',
                margin: 0,
                padding: 0,
                color: theme.palette.text.primary,
                whiteSpace: 'pre',
                overflow: 'auto',
              }}
            >
              {chunk.content}
            </Box>
          </Box>
        );

      case 'text':
      default:
        return (
          <Box key={chunk.id} sx={{ my: 1 }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: (props) => (
                  <Typography
                    variant="body1"
                    sx={{
                      lineHeight: 1.6,
                      color: theme.palette.text.primary,
                      mb: 2,
                      '&:last-child': { mb: 0 },
                    }}
                    {...props}
                  />
                ),
                h1: (props) => (
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      mb: 2,
                      mt: 3,
                      '&:first-of-type': { mt: 0 },
                    }}
                    {...props}
                  />
                ),
                h2: (props) => (
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      mb: 2,
                      mt: 2.5,
                      '&:first-of-type': { mt: 0 },
                    }}
                    {...props}
                  />
                ),
                h3: (props) => (
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      mb: 1.5,
                      mt: 2,
                      '&:first-of-type': { mt: 0 },
                    }}
                    {...props}
                  />
                ),
                code: ({ children, ...props }: { inline?: boolean; children?: React.ReactNode; className?: string; node?: unknown }) => {
                  const codeString = Array.isArray(children)
                    ? children.join("")
                    : String(children);

                  const inline = props.inline;

                  if (!inline) {
                    // Block code - this shouldn't appear in chunked messages as it should be parsed as code-file
                    return (
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
                      >
                        {codeString}
                      </Box>
                    );
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
                },
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
              }}
            >
              {chunk.content}
            </ReactMarkdown>
          </Box>
        );
    }
  };

  return (
    <Box>
      {chunks.map((chunk) => renderChunk(chunk))}
    </Box>
  );
};

export default memo(ChunkedMessageRenderer);
