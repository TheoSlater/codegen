export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  images?: string[]; // Base64 encoded images for vision models
  chunks?: ChatRenderChunk[]; // Optional chunked content for enhanced rendering
}

export type ChatRenderChunk = {
  id: string;
  type: 'text' | 'code-file' | 'command' | 'file-tree';
  content: string;
  filename?: string;
  language?: string;
  metadata?: {
    status?: 'created' | 'updated' | 'deleted';
    size?: string;
    path?: string;
  };
};

export type SendMessageFn = (content: string) => Promise<void>;

import { WebContainer } from "@webcontainer/api";

export interface CodePanelProps {
  code: string;
  setCode: (code: string) => void;
  showTerminal?: boolean;
  isCodeGenerated?: boolean;
  onWriteSuccess?: () => void;
  onWriteError?: (error: string) => void;
}

export interface WebContainerState {
  instance: WebContainer | null;
  previewUrl: string | null;
  isReady: boolean;
}

export interface TerminalState {
  ref: React.RefObject<HTMLDivElement>;
  instance: React.MutableRefObject<import("xterm").Terminal | null>;
}

export interface ErrorState {
  modalOpen: boolean;
  context: string;
}

export interface TabState {
  currentTab: number;
  isWritingCode: boolean;
  showPreviewShimmer: boolean;
}

export const PROJECT_DIR = "my-app";
export const ENTRY_FILE = `/${PROJECT_DIR}/src/App.tsx`;

export interface CommandResult {
  success: boolean;
  output: string;
  exitCode: number;
  error?: string;
}

// New types for command execution
export interface CommandExecutionOptions {
  workingDirectory?: string;
  timeout?: number;
  onOutput?: (data: string) => void;
  onError?: (error: string) => void;
}

export interface TerminalCommandHandler {
  executeCommand: (command: string, options?: CommandExecutionOptions) => Promise<CommandResult>;
  executeMultipleCommands: (commands: string[], options?: CommandExecutionOptions) => Promise<CommandResult[]>;
  isExecuting: boolean;
}