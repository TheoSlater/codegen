import { ChatRenderChunk } from '../types/types';
import { v4 as uuidv4 } from 'uuid';

export interface ParsedMessage {
  chunks: ChatRenderChunk[];
  hasChunks: boolean;
}

/**
 * Parses LLM response content into chunks for enhanced rendering
 * Supports file blocks with format:
 * ---filename: example.tsx---
 * <code content>
 * ---end---
 */
export function parseMessageContent(content: string): ParsedMessage {
  const chunks: ChatRenderChunk[] = [];
  let hasChunks = false;

  // Pattern to match file blocks
  const fileBlockPattern = /---filename:\s*([^\n]+)---\n([\s\S]*?)(?:\n---end---|$)/g;
  
  let lastIndex = 0;
  let match;

  // Find all file blocks
  while ((match = fileBlockPattern.exec(content)) !== null) {
    hasChunks = true;
    const [fullMatch, filename, codeContent] = match;
    const matchStart = match.index;
    const matchEnd = match.index + fullMatch.length;

    // Add any text before this file block
    if (matchStart > lastIndex) {
      const textBefore = content.slice(lastIndex, matchStart).trim();
      if (textBefore) {
        chunks.push({
          id: uuidv4(),
          type: 'text',
          content: textBefore,
        });
      }
    }

    // Add the file block
    chunks.push({
      id: uuidv4(),
      type: 'code-file',
      content: codeContent.trim(),
      filename: filename.trim(),
      metadata: {
        status: 'created', // Default status, can be enhanced later
        size: formatFileSize(new Blob([codeContent]).size),
      },
    });

    lastIndex = matchEnd;
  }

  // Add any remaining text after the last file block
  if (lastIndex < content.length) {
    const textAfter = content.slice(lastIndex).trim();
    if (textAfter) {
      chunks.push({
        id: uuidv4(),
        type: 'text',
        content: textAfter,
      });
    }
  }

  // If no file blocks were found, treat the entire content as text
  if (!hasChunks) {
    chunks.push({
      id: uuidv4(),
      type: 'text',
      content: content,
    });
  }

  return { chunks, hasChunks };
}

/**
 * Alternative parsing for command execution blocks
 * Supports format:
 * ```command
 * npm install react
 * ```
 */
export function parseCommandBlocks(content: string): ParsedMessage {
  const chunks: ChatRenderChunk[] = [];
  let hasChunks = false;

  // Pattern to match command blocks
  const commandPattern = /```command\n([\s\S]*?)```/g;
  
  let lastIndex = 0;
  let match;

  while ((match = commandPattern.exec(content)) !== null) {
    hasChunks = true;
    const [fullMatch, commandContent] = match;
    const matchStart = match.index;
    const matchEnd = match.index + fullMatch.length;

    // Add any text before this command block
    if (matchStart > lastIndex) {
      const textBefore = content.slice(lastIndex, matchStart).trim();
      if (textBefore) {
        chunks.push({
          id: uuidv4(),
          type: 'text',
          content: textBefore,
        });
      }
    }

    // Add the command block
    chunks.push({
      id: uuidv4(),
      type: 'command',
      content: commandContent.trim(),
      filename: 'Terminal',
      language: 'bash',
    });

    lastIndex = matchEnd;
  }

  // Add any remaining text
  if (lastIndex < content.length) {
    const textAfter = content.slice(lastIndex).trim();
    if (textAfter) {
      chunks.push({
        id: uuidv4(),
        type: 'text',
        content: textAfter,
      });
    }
  }

  if (!hasChunks) {
    chunks.push({
      id: uuidv4(),
      type: 'text',
      content: content,
    });
  }

  return { chunks, hasChunks };
}

/**
 * Main parsing function that handles multiple chunk types
 */
export function parseEnhancedMessage(content: string): ParsedMessage {
  // First try to parse file blocks
  const fileParsed = parseMessageContent(content);
  if (fileParsed.hasChunks) {
    // Further parse text chunks for commands
    const enhancedChunks: ChatRenderChunk[] = [];
    
    for (const chunk of fileParsed.chunks) {
      if (chunk.type === 'text') {
        const commandParsed = parseCommandBlocks(chunk.content);
        enhancedChunks.push(...commandParsed.chunks);
      } else {
        enhancedChunks.push(chunk);
      }
    }
    
    return { chunks: enhancedChunks, hasChunks: true };
  }
  
  // If no file blocks, try command blocks only
  return parseCommandBlocks(content);
}

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Utility to create a file chunk manually
 */
export function createFileChunk(
  filename: string,
  content: string,
  status: 'created' | 'updated' | 'deleted' = 'created'
): ChatRenderChunk {
  return {
    id: uuidv4(),
    type: 'code-file',
    content: content.trim(),
    filename,
    metadata: {
      status,
      size: formatFileSize(new Blob([content]).size),
    },
  };
}

/**
 * Utility to create a text chunk manually
 */
export function createTextChunk(content: string): ChatRenderChunk {
  return {
    id: uuidv4(),
    type: 'text',
    content,
  };
}
