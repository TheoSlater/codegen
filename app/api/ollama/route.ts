import { NextRequest, NextResponse } from "next/server";
import { getOllamaResponseStream } from "@/app/hooks/ollamaService";

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json();

    // Get a ReadableStream from Ollama streaming helper
    const stream = await getOllamaResponseStream(messages, model);

    // Return a streaming response to client
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream" }, // or "application/octet-stream"
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
