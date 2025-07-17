import ollama from "ollama";
import { ChatMessage } from "../types/types";

export async function getOllamaResponseStream(
  messages: ChatMessage[],
  model: string
): Promise<ReadableStream<Uint8Array>> {
  // Convert messages to Ollama format, handling images
  const ollamaMessages = messages.map(msg => {
    const ollamaMsg: {
      role: string;
      content: string;
      images?: string[];
    } = {
      role: msg.role,
      content: msg.content
    };
    
    // Add images if they exist (for vision models)
    if (msg.images && msg.images.length > 0) {
      ollamaMsg.images = msg.images;
    }
    
    return ollamaMsg;
  });

  const response = await ollama.chat({
    model,
    messages: ollamaMessages,
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
