import type { SupabaseClient } from "@supabase/supabase-js";

type UsageLimitRow = {
  allowed: boolean;
  request_count: number;
  remaining: number;
  total_tokens: number;
};

type UsageTrackingRow = {
  usage_date: string;
  request_count: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

type UsageEventParams = {
  supabase: SupabaseClient;
  userId: string;
  conversationId?: string | null;
  messageId?: string | null;
  provider?: string;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  latencyMs?: number | null;
  success?: boolean;
  errorCode?: string | null;
};

export type UsageLimitResult = {
  allowed: boolean;
  requestCount: number;
  remaining: number;
  totalTokens: number;
};

export async function enforceDailyUsageLimit(
  supabase: SupabaseClient,
  userId: string,
  dailyLimit: number,
): Promise<UsageLimitResult> {
  const { data, error } = await supabase.rpc("enforce_daily_limit_and_track", {
    p_user_id: userId,
    p_daily_limit: dailyLimit,
    p_prompt_tokens: 0,
    p_completion_tokens: 0,
  });

  if (error) {
    throw new Error(`FAILED_TO_ENFORCE_DAILY_LIMIT: ${error.message}`);
  }

  const row = (data?.[0] ?? null) as UsageLimitRow | null;
  if (!row) {
    return {
      allowed: false,
      requestCount: 0,
      remaining: 0,
      totalTokens: 0,
    };
  }

  return {
    allowed: row.allowed,
    requestCount: row.request_count,
    remaining: row.remaining,
    totalTokens: row.total_tokens,
  };
}

export async function trackUsageTokens(
  supabase: SupabaseClient,
  userId: string,
  promptTokens: number,
  completionTokens: number,
): Promise<{ requestCount: number; totalTokens: number }> {
  const { data, error } = await supabase.rpc("track_usage_tokens", {
    p_user_id: userId,
    p_prompt_tokens: Math.max(promptTokens, 0),
    p_completion_tokens: Math.max(completionTokens, 0),
  });

  if (error) {
    throw new Error(`FAILED_TO_TRACK_USAGE_TOKENS: ${error.message}`);
  }

  const row = (data?.[0] ?? null) as
    | {
        request_count: number;
        total_tokens: number;
      }
    | null;

  return {
    requestCount: row?.request_count ?? 0,
    totalTokens: row?.total_tokens ?? 0,
  };
}

export async function createUsageEvent({
  supabase,
  userId,
  conversationId = null,
  messageId = null,
  provider = "groq",
  model = process.env.GROQ_MODEL?.trim() || "llama-3.1-8b-instant",
  promptTokens = 0,
  completionTokens = 0,
  latencyMs = null,
  success = true,
  errorCode = null,
}: UsageEventParams): Promise<void> {
  const { error } = await supabase.from("usage_events").insert({
    user_id: userId,
    conversation_id: conversationId,
    message_id: messageId,
    provider,
    model,
    prompt_tokens: Math.max(promptTokens, 0),
    completion_tokens: Math.max(completionTokens, 0),
    latency_ms: latencyMs,
    success,
    error_code: errorCode,
  });

  if (error) {
    throw new Error(`FAILED_TO_CREATE_USAGE_EVENT: ${error.message}`);
  }
}

export async function getTodayUsage(
  supabase: SupabaseClient,
  userId: string,
): Promise<UsageTrackingRow> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("usage_tracking")
    .select("usage_date,request_count,prompt_tokens,completion_tokens,total_tokens")
    .eq("user_id", userId)
    .eq("usage_date", today)
    .maybeSingle();

  if (error) {
    throw new Error(`FAILED_TO_FETCH_USAGE: ${error.message}`);
  }

  return (
    (data as UsageTrackingRow | null) ?? {
      usage_date: today,
      request_count: 0,
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
    }
  );
}
