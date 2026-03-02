import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatMode, Conversation } from "@/types/conversation";

type ConversationRow = {
  id: string;
  user_id: string;
  title: string;
  mode: ChatMode;
  model: string;
  is_archived: boolean;
  message_count: number;
  total_tokens: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
};

type ListConversationsParams = {
  supabase: SupabaseClient;
  userId: string;
  limit?: number;
  includeArchived?: boolean;
};

type CreateConversationParams = {
  supabase: SupabaseClient;
  userId: string;
  title?: string;
  mode?: ChatMode;
  model?: string;
};

type DeleteConversationParams = {
  supabase: SupabaseClient;
  userId: string;
  conversationId: string;
};

function mapConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    mode: row.mode,
    model: row.model,
    isArchived: row.is_archived,
    messageCount: row.message_count,
    totalTokens: row.total_tokens,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function buildConversationTitleFromMessage(message: string): string {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "NEW CHAT";
  }

  const maxLength = 80;
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}…`;
}

export async function listConversations({
  supabase,
  userId,
  limit = 30,
  includeArchived = false,
}: ListConversationsParams): Promise<Conversation[]> {
  let query = supabase
    .from("conversations")
    .select(
      "id,user_id,title,mode,model,is_archived,message_count,total_tokens,last_message_at,created_at,updated_at",
    )
    .eq("user_id", userId);

  if (!includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`FAILED_TO_LIST_CONVERSATIONS: ${error.message}`);
  }

  return (data as ConversationRow[] | null)?.map(mapConversation) ?? [];
}

export async function createConversation({
  supabase,
  userId,
  title,
  mode = "explanation",
  model = process.env.GROQ_MODEL?.trim() || "llama-3.1-8b-instant",
}: CreateConversationParams): Promise<Conversation> {
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      title: title?.trim() || "NEW CHAT",
      mode,
      model,
    })
    .select(
      "id,user_id,title,mode,model,is_archived,message_count,total_tokens,last_message_at,created_at,updated_at",
    )
    .single();

  if (error || !data) {
    throw new Error(`FAILED_TO_CREATE_CONVERSATION: ${error?.message ?? "UNKNOWN"}`);
  }

  return mapConversation(data as ConversationRow);
}

export async function getConversationById(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      "id,user_id,title,mode,model,is_archived,message_count,total_tokens,last_message_at,created_at,updated_at",
    )
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`FAILED_TO_GET_CONVERSATION: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapConversation(data as ConversationRow);
}

export async function deleteConversation({
  supabase,
  userId,
  conversationId,
}: DeleteConversationParams): Promise<boolean> {
  const { error, count } = await supabase
    .from("conversations")
    .delete({ count: "exact" })
    .eq("id", conversationId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`FAILED_TO_DELETE_CONVERSATION: ${error.message}`);
  }

  return (count ?? 0) > 0;
}
