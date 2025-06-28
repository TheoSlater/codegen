import { useRef, useState, useCallback } from "react";
import { ChatMessage } from "../types/types";
import { useModel } from "../context/ModelContext";

export function useChatMessages() {
  const { model } = useModel();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }, []);

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
      messagesRef.current = [...messagesRef.current, userMsg];
      scrollToBottom();
      setIsSending(true);

      try {
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        messagesRef.current = [
          ...messagesRef.current,
          { role: "assistant", content: "" },
        ];

        const response = await fetch("/api/ollama", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messagesRef.current],
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
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: assistantText,
              };
              messagesRef.current = updated;
              return updated;
            });
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
            messagesRef.current = updated;
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
            messagesRef.current = updated;
            return updated;
          });
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
    messagesRef.current = [];
  }, []);

  function extractCodeFromMarkdown(text: string): string {
    const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/g;
    let match;
    let code = "";

    while ((match = codeBlockRegex.exec(text)) !== null) {
      code += match[1] + "\n";
    }

    if (code) return code.trim();
    return text.trim();
  }

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
      messagesRef.current = [...messagesRef.current, userMsg];
      scrollToBottom();
      setIsSending(true);

      try {
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        messagesRef.current = [
          ...messagesRef.current,
          { role: "assistant", content: "" },
        ];

        const systemPrompt = {
          role: "system",
          content: [
            "You are a helpful AI developer assistant.",
            "Respond ONLY with clean, runnable React code in TypeScript using Material UI.",
            "Explicitly import every MUI component used, with one import per component like:",
            'import Button from "@mui/material/Button";',
            'import Container from "@mui/material/Container";',
            'import Typography from "@mui/material/Typography";',
            "Do NOT include explanations, comments, markdown syntax, or triple backticks.",
            "Do NOT wrap the code in markdown or any additional formatting.",
            "Output only the raw source code exactly as it should appear in a .tsx file.",
          ].join(" "),
        };

        const payloadMessages = [systemPrompt, ...messagesRef.current];

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
                content: codeOnly,
              };
              messagesRef.current = updated;
              return updated;
            });
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
            messagesRef.current = updated;
            return updated;
          });
        } else {
          console.error("generateCode streaming error:", error);
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: "[Error receiving code response]",
            };
            messagesRef.current = updated;
            return updated;
          });
        }
      } finally {
        setIsSending(false);
        abortControllerRef.current = null;
      }
    },
    [model, scrollToBottom]
  );

  return {
    messages,
    isSending,
    sendMessage,
    clearMessages,
    cancel,
    messagesEndRef,
    generateCode,
  };
}
