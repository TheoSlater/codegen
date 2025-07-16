import { ChatRenderChunk } from '../types/types';

export interface ParsedMessage {
  chunks: ChatRenderChunk[];
  hasChunks: boolean;
}

// Optimized regex patterns (compiled once)
const FILE_PATTERN = /---filename:\s*(.+?)---([\s\S]*?)---end---/g;
const COMMAND_PATTERN = /```(?:bash|shell|cmd)\n([\s\S]*?)```/g;
const FILE_TREE_PATTERN = /```(?:tree|files|structure)\n([\s\S]*?)```/g;

let chunkIdCounter = 0;
const generateChunkId = () => `chunk_${++chunkIdCounter}`;

// Cache for parsed messages to avoid reparsing
const parseCache = new Map<string, ParsedMessage>();
const MAX_CACHE_SIZE = 50;

export function parseEnhancedMessage(content: string): ParsedMessage {
  // Check cache first
  if (parseCache.has(content)) {
    return parseCache.get(content)!;
  }

  const chunks: ChatRenderChunk[] = [];
  let lastIndex = 0;
  let hasSpecialChunks = false;

  // Track all matches with their positions
  const matches: Array<{
    type: 'code-file' | 'command' | 'file-tree';
    start: number;
    end: number;
    content: string;
    filename?: string;
  }> = [];

  // Find file blocks
  let match;
  while ((match = FILE_PATTERN.exec(content)) !== null) {
    matches.push({
      type: 'code-file',
      start: match.index,
      end: match.index + match[0].length,
      content: match[2].trim(),
      filename: match[1].trim()
    });
    hasSpecialChunks = true;
  }

  // Reset regex lastIndex
  FILE_PATTERN.lastIndex = 0;

  // Find command blocks
  while ((match = COMMAND_PATTERN.exec(content)) !== null) {
    matches.push({
      type: 'command',
      start: match.index,
      end: match.index + match[0].length,
      content: match[1].trim()
    });
    hasSpecialChunks = true;
  }

  // Reset regex lastIndex
  COMMAND_PATTERN.lastIndex = 0;

  // Find file tree blocks
  while ((match = FILE_TREE_PATTERN.exec(content)) !== null) {
    matches.push({
      type: 'file-tree',
      start: match.index,
      end: match.index + match[0].length,
      content: match[1].trim()
    });
    hasSpecialChunks = true;
  }

  // Reset regex lastIndex
  FILE_TREE_PATTERN.lastIndex = 0;

  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);

  // Process matches and create chunks
  for (const match of matches) {
    // Add text before this match if any
    if (match.start > lastIndex) {
      const textContent = content.slice(lastIndex, match.start).trim();
      if (textContent) {
        chunks.push({
          id: generateChunkId(),
          type: 'text',
          content: textContent
        });
      }
    }

    // Add the special chunk
    const chunk: ChatRenderChunk = {
      id: generateChunkId(),
      type: match.type,
      content: match.content
    };

    if (match.filename) {
      chunk.filename = match.filename;
      chunk.language = getLanguageFromFilename(match.filename);
    }

    chunks.push(chunk);
    lastIndex = match.end;
  }

  // Add remaining text if any
  if (lastIndex < content.length) {
    const remainingContent = content.slice(lastIndex).trim();
    if (remainingContent) {
      chunks.push({
        id: generateChunkId(),
        type: 'text',
        content: remainingContent
      });
    }
  }

  // If no special chunks found, treat entire content as text
  if (chunks.length === 0) {
    chunks.push({
      id: generateChunkId(),
      type: 'text',
      content: content
    });
  }

  const result: ParsedMessage = {
    chunks,
    hasChunks: hasSpecialChunks
  };

  // Cache the result (with size limit)
  if (parseCache.size >= MAX_CACHE_SIZE) {
    const firstKey = parseCache.keys().next().value;
    if (firstKey) {
      parseCache.delete(firstKey);
    }
  }
  parseCache.set(content, result);

  return result;
}

function getLanguageFromFilename(filename: string): string {
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
}

// Clear cache when needed (for memory management)
export function clearParseCache(): void {
  parseCache.clear();
  chunkIdCounter = 0;
}
