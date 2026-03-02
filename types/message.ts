import type { ChatMode } from "@/types/conversation";

export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "pending" | "completed" | "error";

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  mode: ChatMode;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number | null;
  status: MessageStatus;
  errorCode: string | null;
  errorMessage: string | null;
  clientMessageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiHistoryMessage {
  role: "user" | "assistant";
  content: string;
}
