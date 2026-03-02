export const CHAT_MODES = ["exam", "explanation", "summary"] as const;

export type ChatMode = (typeof CHAT_MODES)[number];

export function isChatMode(value: string): value is ChatMode {
  return CHAT_MODES.includes(value as ChatMode);
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  mode: ChatMode;
  model: string;
  isArchived: boolean;
  messageCount: number;
  totalTokens: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}
