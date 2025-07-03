import ollama from "ollama";

export async function getOllamaResponseStream(
  messages: { role: string; content: string }[],
  model: string
): Promise<ReadableStream<Uint8Array>> {
  const systemPrompt = {
    role: "system",
    content: [
      "You are a helpful AI developer assistant.",
      "Respond ONLY with clean, runnable Vite + React code in TypeScript.",
      "Wrap the code inside triple backticks with the language hint `tsx`.",
      "Do NOT include explanations or comments outside the code block.",
      "Format the code using ```tsx ... ```",
      "Please talk normally as well. If they ask 'code' or something without context or idea, do NOT give code - ask them what their idea is.",
      "Example code structure:",
      "```tsx",
      "import React from 'react';",
      "",
      "function App() {",
      "  return (",
      "    <div>",
      "      <h1>Hello, World!</h1>",
      "    </div>",
      "  );",
      "}",
      "",
      "export default App;",
      "```",
      "You MUST MAKE SURE EVERYTHING AND ALL CODE IS REACT AND TYPESCRIPT"
    ].join("\n"),
  };

  const response = await ollama.chat({
    model,
    messages: [systemPrompt, ...messages],
    stream: true,
  });

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of response) {
          const textChunk = chunk.message.content;
          controller.enqueue(new TextEncoder().encode(textChunk));
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });
}

export async function streamToString(
  stream: ReadableStream<Uint8Array>
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      result += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
  
  return result;
}