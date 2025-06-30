// ollamaService.ts
import ollama from "ollama";

export async function getOllamaResponseStream(
  messages: { role: string; content: string }[],
  model: string
): Promise<ReadableStream<Uint8Array>> {
  const systemPrompt = {
    role: "system",
    content: [
      "You are a helpful AI developer assistant.",
      "Respond ONLY with clean, runnable Vite + React code in TypeScript",
      "Do NOT include explanations, comments, markdown syntax,",
      "Do NOT wrap the code in markdown or any additional formatting.",
      "Output only the raw source code exactly as it should appear in a .tsx file.",
      "Please output your text with triple backticks ``` following with tsx. Example: ```tsx <code_here>```",
    ].join(" "),
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

// Helper: Consume a ReadableStream into a string
export async function streamToString(
  stream: ReadableStream<Uint8Array>
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result;
}
