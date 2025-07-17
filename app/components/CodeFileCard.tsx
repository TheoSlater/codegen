import React, { memo } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  useTheme,
  alpha,
  Stack,
  Chip,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  FilePresent as FileIcon,
  CheckCircle as CheckIcon,
  Update as UpdateIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Highlight, themes } from 'prism-react-renderer';
import { ChatRenderChunk } from '../types/types';

interface CodeFileCardProps {
  chunk: ChatRenderChunk;
  onCopy?: (content: string) => void;
}

const CodeFileCard: React.FC<CodeFileCardProps> = ({ chunk, onCopy }) => {
  const theme = useTheme();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (onCopy) {
      onCopy(chunk.content);
    } else {
      await navigator.clipboard.writeText(chunk.content);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguageFromFilename = (filename?: string): string => {
    if (!filename) return 'typescript';
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'tsx',
      'js': 'javascript',
      'jsx': 'jsx',
      'py': 'python',
      'json': 'json',
      'css': 'css',
      'scss': 'scss',
      'html': 'html',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml',
      'xml': 'xml',
      'sql': 'sql',
      'sh': 'bash',
      'bash': 'bash',
    };
    return langMap[ext || ''] || 'text';
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'created':
        return <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />;
      case 'updated':
        return <UpdateIcon sx={{ fontSize: 16, color: 'warning.main' }} />;
      case 'deleted':
        return <DeleteIcon sx={{ fontSize: 16, color: 'error.main' }} />;
      default:
        return <FileIcon sx={{ fontSize: 16, color: 'primary.main' }} />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'created':
        return theme.palette.success.main;
      case 'updated':
        return theme.palette.warning.main;
      case 'deleted':
        return theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'created':
        return 'Created';
      case 'updated':
        return 'Updated';
      case 'deleted':
        return 'Deleted';
      default:
        return 'File';
    }
  };

  const language = chunk.language || getLanguageFromFilename(chunk.filename);

  return (
    <Paper
      elevation={0}
      sx={{
        my: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          bgcolor: alpha(theme.palette.background.paper, 0.5),
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          {getStatusIcon(chunk.metadata?.status)}
          <Typography
            variant="body2"
            fontWeight={600}
            color="text.primary"
            sx={{ fontFamily: 'monospace' }}
          >
            {chunk.filename || 'untitled'}
          </Typography>
          <Chip
            size="small"
            label={getStatusText(chunk.metadata?.status)}
            sx={{
              height: 20,
              fontSize: '0.7rem',
              bgcolor: alpha(getStatusColor(chunk.metadata?.status), 0.1),
              color: getStatusColor(chunk.metadata?.status),
              border: 'none',
              '& .MuiChip-label': {
                px: 1,
              },
            }}
          />
          {chunk.metadata?.size && (
            <Typography variant="caption" color="text.secondary">
              {chunk.metadata.size}
            </Typography>
          )}
        </Stack>

        <IconButton
          size="small"
          onClick={handleCopy}
          sx={{
            color: copied ? 'success.main' : 'text.secondary',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            },
          }}
        >
          {copied ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* Code Content */}
      <Box
        sx={{
          position: 'relative',
          bgcolor: alpha(theme.palette.background.default, 0.5),
        }}
      >
        <Highlight
          theme={themes.oneDark}
          code={chunk.content}
          language={(language as keyof typeof themes.oneDark) || 'typescript'}
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={className}
              style={{
                ...style,
                margin: 0,
                padding: 16,
                background: 'transparent',
                fontSize: '0.875rem',
                lineHeight: 1.5,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
                overflow: 'auto',
              }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </Box>
    </Paper>
  );
};

export default memo(CodeFileCard);
