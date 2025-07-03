import { useRef, useState, useCallback, useEffect } from "react";
import { ChatMessage } from "../types/types";
import { useModel } from "../context/ModelContext";

export function useChatMessages() {
  const { model } = useModel();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [code, setCode] = useState<string>(""); // New: code state

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);

  // Keep messagesRef in sync with messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }, []);

  function extractCodeFromMarkdown(text: string): string {
    const codeBlockRegex = /```(?:tsx?|jsx?)\n([\s\S]*?)```/g;
    let match;
    let code = "";

    while ((match = codeBlockRegex.exec(text)) !== null) {
      code += match[1] + "\n";
    }

    if (code) return code.trim();
    return text.trim();
  }

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const userMsg: ChatMessage = { role: "user", content };
      setMessages((prev) => [...prev, userMsg]);
      // messagesRef updated via useEffect

      scrollToBottom();
      setIsSending(true);

      try {
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        let assistantText = "";
        setCode(""); // Clear code on new assistant response

        const response = await fetch("/api/ollama", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messagesRef.current, userMsg], // Include user message
            model,
          }),
          signal: controller.signal,
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

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

            // Extract code to update code state if any
            const codeOnly = extractCodeFromMarkdown(assistantText);

            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: assistantText,
              };
              return updated;
            });

            // Update code panel only if code extracted is not empty
            if (codeOnly) {
              setCode(codeOnly);
            } else {
              // If no code block yet, just update with full assistant text
              setCode(assistantText);
            }

            scrollToBottom();
          }
        }
      } catch (error: unknown) {
        if (
          typeof error === "object" &&
          error !== null &&
          "name" in error &&
          (error as { name?: string }).name === "AbortError"
        ) {
          console.log("sendMessage aborted");
          setMessages((prev) => {
            const updated = [...prev];
            if (
              updated.length > 0 &&
              updated[updated.length - 1].role === "assistant"
            ) {
              updated.pop();
            }
            return updated;
          });
        } else {
          console.error("Streaming error:", error);
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: "[Error receiving response]",
            };
            return updated;
          });
          setCode("[Error receiving response]");
        }
      } finally {
        setIsSending(false);
        abortControllerRef.current = null;
      }
    },
    [model, scrollToBottom]
  );

  const generateCode = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const userMsg: ChatMessage = { role: "user", content: prompt };
      setMessages((prev) => [...prev, userMsg]);
      // messagesRef updated via useEffect

      scrollToBottom();
      setIsSending(true);

      try {
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        setCode(""); // Clear code for new generation

        const systemPrompt: ChatMessage = {
          role: "system",
          content: [
            "You are a helpful AI developer assistant.",
            "Respond ONLY with clean, runnable Vite + React code in TypeScript.",
            "Wrap the code inside triple backticks with the language hint `tsx`.",
            "Do NOT include explanations or comments outside the code block.",
            "Format the code using ```<codehere>```",
            "Please talk normally aswell. If they ask 'code' or something without context or idea do NOT give code, ask them what their idea is.",
            `import React from 'react';
      
      function App() {
        return (
          <div>
            <h1>Hello, World!</h1>
          </div>
        );
      }
      
      export default App;
      `,
      "You MUST MAKE SURE EVERYTHING AND ALL CODE IS REACT AND TYPESCRIPT"
          ].join(" "),
        };

        const payloadMessages = [systemPrompt, ...messagesRef.current, userMsg];

        const response = await fetch("/api/ollama", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: payloadMessages,
            model,
          }),
          signal: controller.signal,
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let done = false;
        let assistantText = "";

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
            } else {
              setCode(assistantText);
            }

            scrollToBottom();
          }
        }
      } catch (error: unknown) {
        if (
          typeof error === "object" &&
          error !== null &&
          "name" in error &&
          (error as { name?: string }).name === "AbortError"
        ) {
          console.log("generateCode aborted");
          setMessages((prev) => {
            const updated = [...prev];
            if (
              updated.length > 0 &&
              updated[updated.length - 1].role === "assistant"
            ) {
              updated.pop();
            }
            return updated;
          });
          setCode("");
        } else {
          console.error("generateCode streaming error:", error);
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: "[Error receiving code response]",
            };
            return updated;
          });
          setCode("[Error receiving code response]");
        }
      } finally {
        setIsSending(false);
        abortControllerRef.current = null;
      }
    },
    [model, scrollToBottom]
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

  return {
    messages,
    isSending,
    sendMessage,
    generateCode,
    cancel,
    clearMessages,
    messagesEndRef,
    code,
    setCode,
  };
}
