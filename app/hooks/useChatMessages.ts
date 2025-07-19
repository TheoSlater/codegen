import { useRef, useState, useCallback, useEffect } from "react";
import { ChatMessage } from "../types/types";
import { useModel } from "../context/ModelContext";
import { useCommandExecution } from "./useCommandExecution";
import { parseEnhancedMessage } from "../utils/messageParser";
import { performMemoryCleanup, logMemoryUsage } from "../utils/memoryUtils";

// Performance optimization
const SCROLL_DEBOUNCE = 50;
const MAX_MESSAGES = 15; 
const CONTEXT_LIMIT = 8; 

//Memoized system prompt to avoid recreation on every message
// const SYSTEM_PROMPT = {
//   role: "system",
//   content: [
//     "STRICT MODE: You MUST ONLY respond using these TWO formats. NO OTHER TEXT ALLOWED.",
//     "",
//     "FORMAT 1 - Commands (only when packages are actually needed):",
//     "```bash",
//     "npm install react-router-dom",
//     "```",
//     "",
//     "FORMAT 2 - Files:",
//     "---filename: src/App.tsx---",
//     "import React from 'react';",
//     "function App() {",
//     "  return <div>Hello World</div>;",
//     "}",
//     "export default App;",
//     "---end---",
//     "",
//     "ZERO TOLERANCE RULES:",
//     "- NO plain text responses",
//     "- NO explanations or descriptions", 
//     "- NO markdown code blocks (```tsx, ```js, etc.)",
//     "- NO 'Here is...' or 'This will...' phrases",
//     "- NO package names mentioned outside bash blocks",
//     "- NO duplicate responses",
//     "- NO automatic framer-motion or tailwindcss installation",
//     "- ONLY install packages when explicitly requested or absolutely necessary",
//     "",
//     "REQUIRED BEHAVIOR:",
//     "- For packages: ONLY use ```bash blocks AND only when needed",
//     "- For code: ONLY use ---filename--- blocks",
//     "- Use plain React and CSS unless specific packages are requested",
//     "- NEVER assume user wants animation libraries or CSS frameworks",
//     "- NEVER mix formats",
//     "- NEVER add explanatory text",
//     "",
//     "EXAMPLE USER REQUEST: 'Give me a simple button component'",
//     "CORRECT RESPONSE (no packages needed):",
//     "---filename: src/Button.tsx---",
//     "import React from 'react';",
//     "",
//     "interface ButtonProps {",
//     "  children: React.ReactNode;",
//     "  onClick?: () => void;",
//     "}",
//     "",
//     "export default function Button({ children, onClick }: ButtonProps) {",
//     "  return (",
//     "    <button onClick={onClick} style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>",
//     "      {children}",
//     "    </button>",
//     "  );",
//     "}",
//     "---end---",
//     "",
//     "WRONG RESPONSE (NEVER DO THIS):",
//     "'Here's a button component:'",
//     "```tsx",
//     "// code here",
//     "```",
//     "",
//     "FINAL WARNING: ANY TEXT OUTSIDE THE TWO FORMATS = FAILURE",
//     "PACKAGE WARNING: ONLY install packages when explicitly requested or absolutely necessary",
//   ].join("\n")
// } as const;

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

  // Optimized code extraction - ONLY extract from chunked file format
  const extractCodeFromMarkdown = useCallback((text: string): string => {
    // ONLY extract from file blocks (chunked format) - NO markdown fallback
    const fileMatches = text.match(/---filename:\s*(.+?)---([\s\S]*?)---end---/g);
    if (fileMatches) {
      // Find the main App component or the last file
      for (const match of fileMatches) {
        const fileMatch = match.match(/---filename:\s*(.+?)---([\s\S]*?)---end---/);
        if (fileMatch) {
          const filename = fileMatch[1].trim();
          const content = fileMatch[2].trim();
          
          // Prioritize App.tsx or similar main files (allow all file types)
          if ((filename.includes('App.tsx') || filename.includes('App.js') || 
              filename.includes('index.tsx') || filename.includes('index.js') ||
              filename.includes('main.tsx') || filename.includes('main.js'))) {
            return content;
          }
        }
      }
      
      // If no main file found, return the content of the last file (including CSS for editing)
      for (let i = fileMatches.length - 1; i >= 0; i--) {
        const lastMatch = fileMatches[i];
        const lastFileMatch = lastMatch.match(/---filename:\s*(.+?)---([\s\S]*?)---end---/);
        if (lastFileMatch) {
          const content = lastFileMatch[2].trim();
          
          // Return any file content (removed CSS filtering)
          return content;
        }
      }
    }
    
    // Try to extract partial file content during streaming (before ---end--- is reached)
    const partialFileMatch = text.match(/---filename:\s*(.+?)---([\s\S]*?)$/);
    if (partialFileMatch) {
      const content = partialFileMatch[2].trim();
      
      // Extract code from file blocks (support any file type including CSS)
      if (content.length > 50) { // Require at least 50 characters for meaningful partial content
        return content;
      }
    }
    
    // NO FALLBACK - only chunked format is allowed
    return "";
  }, []);

  // AI Command Service reference for executing commands from AI responses
  const aiCommandServiceRef = useRef<import('../services/aiCommandService').AICommandService | null>(null);

  const getAICommandService = useCallback(async () => {
    if (!aiCommandServiceRef.current) {
      const { AICommandService } = await import('../services/aiCommandService');
      aiCommandServiceRef.current = new AICommandService();
    }
    return aiCommandServiceRef.current;
  }, []);

  // Enhanced LLM response handler with proper AI command service
  const handleLLMResponseWithCommandExecution = useCallback(async (response: string) => {
    console.log('🎯 handleLLMResponseWithCommandExecution called');
    
    try {
      // Check for bash commands with detailed logging
      const hasBashCommands = response.includes('```bash') || response.includes('```shell') || response.includes('```cmd');
      console.log(`🔍 Checking for bash commands. Found: ${hasBashCommands}`);
      
      if (hasBashCommands) {
        console.log('🔧 Found bash commands in AI response, executing via AICommandService...');
        console.log('📝 Response excerpt:', response.substring(0, 500) + (response.length > 500 ? '...' : ''));
        
        // Use the dedicated AI command service for proper execution
        const aiCommandService = await getAICommandService();
        console.log('📦 AICommandService initialized');
        
        const results = await aiCommandService.executeAIResponse(response);
        
        console.log(`✅ AICommandService completed. ${results.length} results:`, 
          results.map(r => `${r.success ? '✅' : '❌'} (exit: ${r.exitCode})`));
        
        // Add system messages for each command result
        for (const result of results) {
          const message = `${result.success ? '✅' : '❌'} Command completed: ${result.success ? 'Success' : `Failed (${result.error || 'Unknown error'})`}`;
          console.log('📨 Adding system message:', message);
          addMessage({
            role: "system",
            content: message
          });
        }
        
        if (results.length === 0) {
          console.log('⚠️ No commands were executed from the AI response');
        }
        
      } else {
        console.log('ℹ️ No bash command blocks found in AI response');
        // Show a sample of the response to debug why commands weren't found
        const bashSample = response.match(/```[\s\S]{0,100}/g);
        if (bashSample) {
          console.log('🔍 Found code blocks but not bash:', bashSample);
        }
      }
      
    } catch (error) {
      console.error('❌ Command execution error:', error);
      addMessage({
        role: "system",
        content: `❌ Command execution failed: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }, [addMessage, getAICommandService]);

  // Initialize file processor
  const fileProcessorRef = useRef<import('../services/aiFileProcessor').AIFileProcessor | null>(null);

  const getFileProcessor = useCallback(async () => {
    if (!fileProcessorRef.current) {
      const { AIFileProcessor } = await import('../services/aiFileProcessor');
      fileProcessorRef.current = new AIFileProcessor();
    }
    return fileProcessorRef.current;
  }, []);

  // Real-time message updates during streaming with file creation
  const updateStreamingMessage = useCallback(async (assistantText: string) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = {
        role: "assistant",
        content: assistantText,
      };
      return updated;
    });

    // Process files in real-time during streaming
    try {
      const fileProcessor = await getFileProcessor();
      await fileProcessor.processStreamingFiles(assistantText);
    } catch (error) {
      console.error('Error processing streaming files:', error);
    }

    // DON'T update code panel during streaming for partial content
    // This prevents fast-refresh issues during generation
  }, [getFileProcessor]);


  const sendMessage = useCallback(
    async (content: string, images?: string[]) => {
      if (!content.trim()) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Clear processed files for new conversation
      try {
        const fileProcessor = await getFileProcessor();
        fileProcessor.clearProcessedFiles();
      } catch (error) {
        console.warn('Error clearing processed files:', error);
      }

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
            // remove SYSTEM_PROMPT for now. Testing new Kernl modle
            messages: [ ...contextMessages, userMsg],
            model,
          }),
          signal: controller.signal,
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";
        let done = false;

        while (!done) {
          if (controller.signal.aborted) {
            await reader.cancel();
            throw new DOMException("Aborted", "AbortError");
          }

          const { value, done: doneReading } = await reader.read();
          done = doneReading;

          if (value) {
            assistantText += decoder.decode(value, { stream: true });
            
            // Update UI in real-time for every chunk (but don't update code panel)
            updateStreamingMessage(assistantText);

            // DON'T update code panel during streaming to prevent fast-refresh
            // The code panel will be updated when streaming is complete

            // Debounced scroll
            scrollToBottom();
          }
        }

        // Parse chunks and execute commands after message is complete
        const parsed = parseEnhancedMessage(assistantText);
        
        // Process any remaining files that weren't handled during streaming
        try {
          const fileProcessor = await getFileProcessor();
          const processResults = await fileProcessor.processAIResponse(assistantText);
          
          if (processResults.length > 0) {
            console.log(`📁 Post-processed ${processResults.length} files:`, 
              processResults.map(r => `${r.filename}: ${r.success ? '✅' : '❌'}`).join(', '));
          }
        } catch (error) {
          console.error('Error in post-processing files:', error);
        }
        
        // Debug logging (can be removed later)
        console.log('🔍 AI Response for debugging:', assistantText);
        
        
        // Final code extraction to ensure code panel is updated
        const finalCode = extractCodeFromMarkdown(assistantText);
        if (finalCode) {
          setCode(finalCode);
        }
        
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
    [model, scrollToBottom, handleLLMResponseWithCommandExecution, extractCodeFromMarkdown, updateStreamingMessage, getFileProcessor]
  );

  const generateCode = useCallback(
    async (prompt: string) => {
      const codePrompt = `Generate React TypeScript code for: ${prompt}. Use only the chunked format with ---filename--- blocks.`;
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
      const scrollTimeout = scrollTimeoutRef.current;
      
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
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
