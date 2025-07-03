export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

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