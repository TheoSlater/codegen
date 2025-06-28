export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type SendMessageFn = (content: string) => Promise<void>;
