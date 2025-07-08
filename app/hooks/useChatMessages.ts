import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { ChatMessage } from "../types/types";
import { useModel } from "../context/ModelContext";
import { useCommandExecution } from "./useCommandExecution";
import { CommandExecutionService } from "../services/commandExecutionService";


const SCROLL_DEBOUNCE = 100;
const MAX_MESSAGES = 50;

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

  // Memoize command service creation
  const commandService = useMemo(() => {
    if (typeof window !== 'undefined') {
      return new CommandExecutionService();
    }
    return null;
  }, []);

  // Optimized command execution with minimal state updates
  const {
    executeCommand,
    isExecuting: isExecutingCommand,
    lastResult: lastCommandResult
  } = useCommandExecution({
    onCommandStart: useCallback((command: string) => {
      setMessages(prev => {
        const newMessage: ChatMessage = {
          role: "system",
          content: `🔧 Executing: ${command}`
        };
        // Limit messages for performance
        const updated = prev.length >= MAX_MESSAGES 
          ? [...prev.slice(1), newMessage]
          : [...prev, newMessage];
        return updated;
      });
    }, []),
    onCommandComplete: useCallback((command: string, result: { success: boolean; output: string }) => {
      setMessages(prev => {
        const newMessage: ChatMessage = {
          role: "system",
          content: `${result.success ? '✅' : '❌'} ${command}: ${result.success ? 'Success' : 'Failed'}`
        };
        const updated = prev.length >= MAX_MESSAGES 
          ? [...prev.slice(1), newMessage]
          : [...prev, newMessage];
        return updated;
      });
    }, [])
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

  // Optimized code extraction
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
      setMessages(prev => [...prev, {
        role: "system",
        content: `❌ Command execution failed: ${error instanceof Error ? error.message : String(error)}`
      }]);
    }
  }, [commandService]);


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
      setMessages((prev) => {
        const assistantMsg: ChatMessage = { role: "assistant", content: "" };
        const updated = prev.length >= MAX_MESSAGES 
          ? [...prev.slice(1), userMsg, assistantMsg]
          : [...prev, userMsg, assistantMsg];
        return updated;
      });

      scrollToBottom();
      setIsSending(true);

      try {
        const systemPrompt = {
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
            "## 🛠️ Command Execution",
            "- Wrap any shell commands in triple backticks with `bash` for automatic execution",
            "- Use for installing packages, running scripts, inspecting directories, etc.",
            "- Example:",
            "```bash",
            "npm install axios",
            "```",
            "",
            "**Common Commands:**",
            "- `npm install <package>` — install packages",
            "- `npm install --save-dev <package>` — install dev dependencies",
            "- `npm run <script>` — run npm scripts",
            "- `ls -la` — list files",
            "- `cat <file>` — view file contents",
            "- `pwd`, `touch`, `mkdir`, etc. — any standard bash commands",
            "",
            "## ⚛️ Code Generation",
            "- Always generate code in TypeScript using React and Vite conventions",
            "- Wrap code in triple backticks with `tsx` for syntax highlighting",
            "- Structure code for readability and correctness",
            "- Example:",
            "```tsx",
            "import React from 'react';",
            "",
            "function App() {",
            "  return <h1>Hello, World!</h1>;",
            "}",
            "",
            "export default App;",
            "```",
            "",
            "## 📦 Dependency Handling",
            "- If the code depends on any packages, include the corresponding `npm install` command **before** the code",
            "- Mention types packages (e.g., `@types/react`) when needed",
            "",
            "## 💡 Response Format",
            "- Provide brief explanations or reasoning **outside** code blocks",
            "- Wrap terminal commands in `bash` blocks",
            "- Wrap code in `tsx` blocks",
            "- Ask clarifying questions when the user's request is ambiguous",
            "",
            "## ✅ Example Response",
            "I'll generate a reusable `Button` component. First, let's install the necessary types:",
            "",
            "```bash",
            "npm install @types/react",
            "```",
            "",
            "Now here's the component code:",
            "",
            "```tsx",
            "import React from 'react';",
            "",
            "type ButtonProps = {",
            "  onClick: () => void;",
            "  children: React.ReactNode;",
            "};",
            "",
            "function Button({ onClick, children }: ButtonProps) {",
            "  return (",
            "    <button onClick={onClick} className=\"px-4 py-2 bg-blue-500 text-white rounded\">",
            "      {children}",
            "    </button>",
            "  );",
            "}",
            "",
            "export default Button;",
            "```"
          ].join("\n")
          
        };

        const response = await fetch("/api/ollama", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [systemPrompt, ...messagesRef.current.slice(-10), userMsg], // Limit context
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
            const codeOnly = extractCodeFromMarkdown(assistantText);

            // Batch updates for better performance
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: assistantText,
              };
              return updated;
            });

            if (codeOnly) {
              setCode(codeOnly);
            }

            // Debounced scroll
            scrollToBottom();
          }
        }

        // Execute commands after message is complete
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
    [model, scrollToBottom, handleLLMResponseWithCommandExecution, extractCodeFromMarkdown]
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