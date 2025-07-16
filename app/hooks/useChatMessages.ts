import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { ChatMessage } from "../types/types";
import { useModel } from "../context/ModelContext";
import { useCommandExecution } from "./useCommandExecution";
import { CommandExecutionService } from "../services/commandExecutionService";
import { parseEnhancedMessage } from "../utils/messageParser";
import { performMemoryCleanup, logMemoryUsage } from "../utils/memoryUtils";

// Performance optimizations - Aggressive memory management
const SCROLL_DEBOUNCE = 200; // Increased debounce
const MAX_MESSAGES = 15; // Further reduced from 20
const UPDATE_THROTTLE = 250; // Increased throttle for less frequent updates
const CONTEXT_LIMIT = 6; // Reduced from 8
const STREAMING_UPDATE_BATCH_SIZE = 100; // Only update every 100 chars during streaming

// Memoized system prompt to avoid recreation on every message
const SYSTEM_PROMPT = {
  role: "system",
  content: [
    "You are an expert AI developer assistant working inside a WebContainer-based environment.",
    "You can run terminal commands and generate React + TypeScript code using Vite.",
    "",
    "## 🧠 Your Capabilities",
    "- Run bash commands inside a fully functional terminal",
    "- Generate clean, runnable React components in TypeScript (Vite setup)",
    "- Modify, inspect, and reason about code or project files",
    "",
    "## 📄 File Generation Format",
    "When creating or showing files, use this EXACT format:",
    "",
    "---filename: src/App.tsx---",
    "import React from 'react';",
    "",
    "function App() {",
    "  return React.createElement('h1', null, 'Hello, World!');",
    "}",
    "",
    "export default App;",
    "---end---",
    "",
    "## 🛠️ Command Execution",
    "- Wrap shell commands in triple backticks with `bash`",
    "",
    "## ⚛️ Code Generation",
    "- Always generate TypeScript React code using Vite conventions",
    "- Use the file format above for complete files",
    "- Structure code for readability and correctness",
    "",
    "## 💡 Response Format",
    "- Be concise and focused",
    "- Use the ---filename--- format for complete files",
    "- Ask clarifying questions when requests are ambiguous",
    "FOR NOW YOU MUST JUST USE App.tsx not src/components/",
  ].join("\n")
} as const;

export function useChatMessages(): {
  messages: ChatMessage[];
  isSending: boolean;
  sendMessage: (content: string, images?: string[]) => Promise<void>;
  generateCode: (prompt: string) => Promise<void>;
  cancel: () => void;
  clearMessages: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  code: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  runCommand: (command: string) => Promise<unknown>;
  lastCommandResult: unknown;
  isExecutingCommand: boolean;
} {
  const { model } = useModel();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [code, setCode] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize command service creation
  const commandService = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new CommandExecutionService();
    }
    return null;
  }, []);

  // Auto-cleanup old messages when limit is reached
  const addMessage = useCallback((newMessage: ChatMessage) => {
    setMessages(prev => {
      const updated = prev.length >= MAX_MESSAGES 
        ? [...prev.slice(-MAX_MESSAGES + 1), newMessage]
        : [...prev, newMessage];
      return updated;
    });
  }, []);

  // Optimized command execution with minimal state updates
  const {
    executeCommand,
    isExecuting: isExecutingCommand,
    lastResult: lastCommandResult
  } = useCommandExecution({
    onCommandStart: useCallback((command: string) => {
      addMessage({
        role: "system",
        content: `🔧 Executing: ${command}`
      });
    }, [addMessage]),
    onCommandComplete: useCallback((command: string, result: { success: boolean; output: string }) => {
      addMessage({
        role: "system",
        content: `${result.success ? '✅' : '❌'} ${command}: ${result.success ? 'Success' : 'Failed'}`
      });
    }, [addMessage])
  });

  // Keep messagesRef in sync with messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Debounced scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, SCROLL_DEBOUNCE);
  }, []);

  // Optimized code extraction with caching
  const extractCodeFromMarkdown = useCallback((text: string): string => {
    const codeBlockRegex = /```(?:tsx?|jsx?|javascript|typescript)\n([\s\S]*?)```/g;
    const matches = text.match(codeBlockRegex);
    
    if (!matches) return "";
    
    return matches
      .map(match => match.replace(/```(?:tsx?|jsx?|javascript|typescript)\n/, '').replace(/```$/, ''))
      .join("\n")
      .trim();
  }, []);

  // Optimized LLM response handler
  const handleLLMResponseWithCommandExecution = useCallback(async (response: string) => {
    if (!commandService || (!response.includes('```bash') && !response.includes('```shell') && !response.includes('```cmd'))) {
      return;
    }
    
    try {
      await commandService.executeAICommands(response);
    } catch (error) {
      addMessage({
        role: "system",
        content: `❌ Command execution failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }, [commandService, addMessage]);

  // Throttled message updates during streaming with batching
  const updateStreamingMessage = useCallback((assistantText: string) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Only update if we have enough new content (batching)
    updateTimeoutRef.current = setTimeout(() => {
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: assistantText,
        };
        return updated;
      });
    }, UPDATE_THROTTLE);
  }, []);

  const sendMessage = useCallback(
    async (content: string, images?: string[]) => {
      if (!content.trim()) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const userMsg: ChatMessage = { 
        role: "user", 
        content,
        ...(images && images.length > 0 ? { images } : {})
      };
      
      // Add user message and placeholder assistant message
      setMessages((prev) => {
        const assistantMsg: ChatMessage = { role: "assistant", content: "" };
        const updated = prev.length >= MAX_MESSAGES - 1
          ? [...prev.slice(-MAX_MESSAGES + 2), userMsg, assistantMsg]
          : [...prev, userMsg, assistantMsg];
        return updated;
      });

      scrollToBottom();
      setIsSending(true);

      try {
        // Use limited context for API call to reduce memory usage
        const contextMessages = messagesRef.current.slice(-CONTEXT_LIMIT);
        
        const response = await fetch("/api/ollama", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [SYSTEM_PROMPT, ...contextMessages, userMsg],
            model,
          }),
          signal: controller.signal,
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";
        let done = false;
        let lastUpdateLength = 0;

        while (!done) {
          if (controller.signal.aborted) {
            await reader.cancel();
            throw new DOMException("Aborted", "AbortError");
          }

          const { value, done: doneReading } = await reader.read();
          done = doneReading;

          if (value) {
            assistantText += decoder.decode(value, { stream: true });
            const codeOnly = extractCodeFromMarkdown(assistantText);

            // Only update UI if we have significant new content (batching)
            if (assistantText.length - lastUpdateLength >= STREAMING_UPDATE_BATCH_SIZE) {
              updateStreamingMessage(assistantText);
              lastUpdateLength = assistantText.length;
            }

            if (codeOnly) {
              setCode(codeOnly);
            }

            // Debounced scroll
            scrollToBottom();
          }
        }

        // Parse chunks and execute commands after message is complete
        const parsed = parseEnhancedMessage(assistantText);
        
        // Final update with chunks
        setMessages((prev) => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              role: "assistant",
              content: assistantText,
              chunks: parsed.hasChunks ? parsed.chunks : undefined,
            };
          }
          return updated;
        });

        await handleLLMResponseWithCommandExecution(assistantText);
        
      } catch (error: unknown) {
        if (
          typeof error === "object" &&
          error !== null &&
          "name" in error &&
          error.name === "AbortError"
        ) {
          console.log("Request aborted");
          return;
        }

        console.error("Error in sendMessage:", error);
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "[Error receiving response]",
          };
          return updated;
        });
        setCode("[Error receiving response]");
      } finally {
        setIsSending(false);
        abortControllerRef.current = null;
      }
    },
    [model, scrollToBottom, handleLLMResponseWithCommandExecution, extractCodeFromMarkdown, updateStreamingMessage]
  );

  const generateCode = useCallback(
    async (prompt: string) => {
      const codePrompt = `Generate React TypeScript code for: ${prompt}. Return only the code in a tsx block.`;
      await sendMessage(codePrompt);
    },
    [sendMessage]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsSending(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCode("");
    // Perform memory cleanup when clearing messages
    performMemoryCleanup();
    if (process.env.NODE_ENV === 'development') {
      logMemoryUsage();
    }
  }, []);

  const runCommand = useCallback(async (command: string) => {
    const result = await executeCommand(command);
    scrollToBottom();
    return result;
  }, [executeCommand, scrollToBottom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    isSending: isSending || isExecutingCommand,
    sendMessage,
    generateCode,
    cancel,
    clearMessages,
    messagesEndRef: messagesEndRef as React.RefObject<HTMLDivElement>,
    code,
    setCode,
    runCommand,
    lastCommandResult,
    isExecutingCommand
  };
}