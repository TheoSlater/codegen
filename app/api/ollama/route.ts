import { NextRequest, NextResponse } from "next/server";
import { getOllamaResponseStream } from "@/app/hooks/ollamaService";
import { ChatMessage } from "@/app/types/types";

export async function POST(req: NextRequest) {
  try {
    const { messages, model }: { messages: ChatMessage[], model: string } = await req.json();

    // Get a ReadableStream from Ollama streaming helper
    const stream = await getOllamaResponseStream(messages, model);

    // Return a streaming response to client with optimized headers
    return new Response(stream, {
      headers: { 
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
