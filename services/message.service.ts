import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatMode } from "@/types/conversation";
import type { AiHistoryMessage, Message, MessageRole, MessageStatus } from "@/types/message";

type MessageRow = {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  mode: ChatMode;
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number | null;
  status: MessageStatus;
  error_code: string | null;
  error_message: string | null;
  client_message_id: string | null;
  created_at: string;
  updated_at: string;
};

type CreateMessageParams = {
  supabase: SupabaseClient;
  conversationId: string;
  role: MessageRole;
  content: string;
  mode: ChatMode;
  provider?: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number | null;
  status?: MessageStatus;
  errorCode?: string | null;
  errorMessage?: string | null;
  clientMessageId?: string | null;
};

function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    mode: row.mode,
    provider: row.provider,
    model: row.model,
    promptTokens: row.prompt_tokens,
    completionTokens: row.completion_tokens,
    totalTokens: row.total_tokens,
    latencyMs: row.latency_ms,
    status: row.status,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    clientMessageId: row.client_message_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createMessage({
  supabase,
  conversationId,
  role,
  content,
  mode,
  provider = "groq",
  model = process.env.GROQ_MODEL?.trim() || "llama-3.1-8b-instant",
  promptTokens = 0,
  completionTokens = 0,
  latencyMs = null,
  status = "completed",
  errorCode = null,
  errorMessage = null,
  clientMessageId = null,
}: CreateMessageParams): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      role,
      content,
      mode,
      provider,
      model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      latency_ms: latencyMs,
      status,
      error_code: errorCode,
      error_message: errorMessage,
      client_message_id: clientMessageId,
    })
    .select(
      "id,conversation_id,role,content,mode,provider,model,prompt_tokens,completion_tokens,total_tokens,latency_ms,status,error_code,error_message,client_message_id,created_at,updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(`FAILED_TO_CREATE_MESSAGE: ${error?.message ?? "UNKNOWN"}`);
  }

  return mapMessage(data as MessageRow);
}

export async function listConversationMessages(
  supabase: SupabaseClient,
  conversationId: string,
  limit = 100,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(
      "id,conversation_id,role,content,mode,provider,model,prompt_tokens,completion_tokens,total_tokens,latency_ms,status,error_code,error_message,client_message_id,created_at,updated_at",
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`FAILED_TO_LIST_MESSAGES: ${error.message}`);
  }

  return (data as MessageRow[] | null)?.map(mapMessage) ?? [];
}

export async function listHistoryForAi(
  supabase: SupabaseClient,
  conversationId: string,
  limit = 20,
): Promise<AiHistoryMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("role,content,status")
    .eq("conversation_id", conversationId)
    .in("role", ["user", "assistant"])
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`FAILED_TO_FETCH_AI_HISTORY: ${error.message}`);
  }

  const rows = (data ?? []).reverse() as Array<{
    role: "user" | "assistant";
    content: string;
  }>;

  return rows.map((row) => ({
    role: row.role,
    content: row.content,
  }));
}
