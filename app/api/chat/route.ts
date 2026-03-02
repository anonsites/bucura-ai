import { NextResponse } from "next/server";
import {
  generateAiResponse,
  streamAiResponse,
  type GenerateAiResponseResult,
} from "@/lib/ai";
import { getAuthenticatedUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getDailyRequestLimit } from "@/lib/usage";
import {
  buildConversationTitleFromMessage,
  createConversation,
  getConversationById,
} from "@/services/conversation.service";
import {
  createMessage,
  listConversationMessages,
  listHistoryForAi,
} from "@/services/message.service";
import {
  createUsageEvent,
  enforceDailyUsageLimit,
  trackUsageTokens,
} from "@/services/usage.service";
import { isChatMode, type ChatMode, type Conversation } from "@/types/conversation";
import type { SupabaseClient } from "@supabase/supabase-js";

type ChatRequestBody = {
  conversationId?: string;
  message?: string;
  mode?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  clientMessageId?: string;
  stream?: boolean;
};

const MAX_MESSAGE_LENGTH = 6000;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseNumber(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return value;
}

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function toClientAiErrorMessage(raw: string): string {
  const value = raw.toLowerCase();

  if (value.includes("missing required environment variable: groq_api_key")) {
    return "Server is missing GROQ_API_KEY. Add it in .env.local and restart the dev server.";
  }
  if (value.includes("groq api error (401")) {
    return "Groq rejected your API key. Check GROQ_API_KEY in .env.local.";
  }
  if (value.includes("groq api error (404")) {
    return "Selected GROQ_MODEL was not found. Check GROQ_MODEL in .env.local.";
  }
  if (value.includes("groq api error (429")) {
    return "Groq rate limit reached. Try again in a moment.";
  }
  if (value.includes("track_usage_tokens")) {
    return "Database usage tracking function is missing. Run the latest schema.sql in Supabase.";
  }
  if (value.includes("usage_events")) {
    return "Database usage_events table/policies are not ready. Run the latest schema.sql in Supabase.";
  }
  if (value.includes("messages")) {
    return "Database messages table/policies are not ready. Run the latest schema.sql in Supabase.";
  }
  if (value.includes("empty streamed response")) {
    return "Groq returned an empty response. Try sending the message again.";
  }

  return "Unable to generate response at this time.";
}

type ParsedChatRequest = {
  conversationId: string | null;
  message: string;
  mode: ChatMode;
  model: string;
  maxTokens: number;
  temperature: number;
  clientMessageId: string | null;
  stream: boolean;
};

function parseChatRequest(body: ChatRequestBody): ParsedChatRequest {
  const message = body.message?.trim() || "";
  if (!message) {
    throw new Error("MESSAGE_IS_REQUIRED");
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error("MESSAGE_TOO_LONG");
  }

  const mode = body.mode && isChatMode(body.mode) ? body.mode : "explanation";
  const model =
    body.model?.trim() || process.env.GROQ_MODEL?.trim() || "llama-3.1-8b-instant";
  const maxTokens = Math.min(Math.max(parseNumber(body.maxTokens, 500), 50), 1200);
  const temperature = Math.min(Math.max(parseNumber(body.temperature, 0.4), 0), 1);

  const conversationId = body.conversationId?.trim() || null;
  if (conversationId && !isUuid(conversationId)) {
    throw new Error("INVALID_CONVERSATION_ID");
  }

  const clientMessageId = body.clientMessageId?.trim() || null;
  if (clientMessageId && !isUuid(clientMessageId)) {
    throw new Error("INVALID_CLIENT_MESSAGE_ID");
  }

  return {
    conversationId,
    message,
    mode,
    model,
    maxTokens,
    temperature,
    clientMessageId,
    stream: Boolean(body.stream),
  };
}

async function persistSuccessfulAssistantResponse({
  supabase,
  userId,
  conversation,
  mode,
  ai,
  usageRequestCount,
  usageRemaining,
}: {
  supabase: SupabaseClient;
  userId: string;
  conversation: Conversation;
  mode: ChatMode;
  ai: GenerateAiResponseResult;
  usageRequestCount: number;
  usageRemaining: number;
}) {
  const assistantMessage = await createMessage({
    supabase,
    conversationId: conversation.id,
    role: "assistant",
    content: ai.content,
    mode,
    provider: ai.provider,
    model: ai.model,
    promptTokens: ai.promptTokens,
    completionTokens: ai.completionTokens,
    latencyMs: ai.latencyMs,
    status: "completed",
  });

  try {
    await trackUsageTokens(supabase, userId, ai.promptTokens, ai.completionTokens);
  } catch (error) {
    const details =
      error instanceof Error ? error.message : "UNKNOWN_TRACK_USAGE_ERROR";
    console.error("[CHAT] NON_BLOCKING_TRACK_USAGE_ERROR", details);
  }

  try {
    await createUsageEvent({
      supabase,
      userId,
      conversationId: conversation.id,
      messageId: assistantMessage.id,
      provider: ai.provider,
      model: ai.model,
      promptTokens: ai.promptTokens,
      completionTokens: ai.completionTokens,
      latencyMs: ai.latencyMs,
      success: true,
    });
  } catch (error) {
    const details =
      error instanceof Error ? error.message : "UNKNOWN_CREATE_USAGE_EVENT_ERROR";
    console.error("[CHAT] NON_BLOCKING_USAGE_EVENT_ERROR", details);
  }

  return {
    assistantMessage,
    usage: {
      requestCount: usageRequestCount,
      remaining: usageRemaining,
    },
  };
}

async function persistFailedAssistantResponse({
  supabase,
  userId,
  conversation,
  mode,
  model,
  errorMessage,
}: {
  supabase: SupabaseClient;
  userId: string;
  conversation: Conversation;
  mode: ChatMode;
  model: string;
  errorMessage: string;
}) {
  try {
    await createMessage({
      supabase,
      conversationId: conversation.id,
      role: "assistant",
      content: "I could not generate a response right now. Please try again.",
      mode,
      provider: "groq",
      model,
      status: "error",
      errorCode: "GROQ_API_ERROR",
      errorMessage,
    });
  } catch (error) {
    const details =
      error instanceof Error ? error.message : "UNKNOWN_ERROR_MESSAGE_INSERT";
    console.error("[CHAT] NON_BLOCKING_ERROR_MESSAGE_INSERT_FAILED", details);
  }

  try {
    await createUsageEvent({
      supabase,
      userId,
      conversationId: conversation.id,
      provider: "groq",
      model,
      success: false,
      errorCode: "GROQ_API_ERROR",
    });
  } catch (error) {
    const details =
      error instanceof Error ? error.message : "UNKNOWN_ERROR_USAGE_EVENT";
    console.error("[CHAT] NON_BLOCKING_ERROR_USAGE_EVENT_FAILED", details);
  }
}

function sseEvent(name: string, payload: unknown): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`event: ${name}\ndata: ${JSON.stringify(payload)}\n\n`);
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { user } = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId")?.trim();

    if (!conversationId) {
      return NextResponse.json(
        {
          error: "MISSING_CONVERSATION_ID",
          message: "conversationId query parameter is required.",
        },
        { status: 400 },
      );
    }

    if (!isUuid(conversationId)) {
      return NextResponse.json(
        { error: "INVALID_CONVERSATION_ID" },
        { status: 400 },
      );
    }

    const conversation = await getConversationById(supabase, user.id, conversationId);

    if (!conversation) {
      return NextResponse.json(
        { error: "CONVERSATION_NOT_FOUND" },
        { status: 404 },
      );
    }

    const messages = await listConversationMessages(supabase, conversationId, 300);

    return NextResponse.json({ conversation, messages });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "UNKNOWN_CHAT_FETCH_ERROR";
    return NextResponse.json(
      { error: "FAILED_TO_FETCH_CHAT", message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { user } = await getAuthenticatedUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    let body: ChatRequestBody;
    try {
      body = (await request.json()) as ChatRequestBody;
    } catch {
      return NextResponse.json(
        { error: "INVALID_JSON_BODY", message: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    let parsed: ParsedChatRequest;
    try {
      parsed = parseChatRequest(body);
    } catch (error) {
      const code = error instanceof Error ? error.message : "INVALID_CHAT_REQUEST";
      if (code === "MESSAGE_IS_REQUIRED") {
        return NextResponse.json(
          { error: "INVALID_MESSAGE", message: "Message is required." },
          { status: 400 },
        );
      }
      if (code === "MESSAGE_TOO_LONG") {
        return NextResponse.json(
          {
            error: "MESSAGE_TOO_LONG",
            message: `Message must be ${MAX_MESSAGE_LENGTH} characters or less.`,
          },
          { status: 400 },
        );
      }
      if (code === "INVALID_CONVERSATION_ID") {
        return NextResponse.json(
          { error: "INVALID_CONVERSATION_ID" },
          { status: 400 },
        );
      }
      if (code === "INVALID_CLIENT_MESSAGE_ID") {
        return NextResponse.json(
          { error: "INVALID_CLIENT_MESSAGE_ID" },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { error: "INVALID_CHAT_REQUEST", message: "Invalid request body." },
        { status: 400 },
      );
    }

    const usageLimit = await enforceDailyUsageLimit(
      supabase,
      user.id,
      getDailyRequestLimit(),
    );

    if (!usageLimit.allowed) {
      return NextResponse.json(
        {
          error: "DAILY_LIMIT_REACHED",
          requestCount: usageLimit.requestCount,
          remaining: usageLimit.remaining,
          totalTokens: usageLimit.totalTokens,
        },
        { status: 429 },
      );
    }

    const conversation = parsed.conversationId
      ? await getConversationById(supabase, user.id, parsed.conversationId)
      : await createConversation({
          supabase,
          userId: user.id,
          title: buildConversationTitleFromMessage(parsed.message),
          mode: parsed.mode,
          model: parsed.model,
        });

    if (!conversation) {
      return NextResponse.json(
        { error: "CONVERSATION_NOT_FOUND" },
        { status: 404 },
      );
    }

    const history = await listHistoryForAi(supabase, conversation.id, 20);

    await createMessage({
      supabase,
      conversationId: conversation.id,
      role: "user",
      content: parsed.message,
      mode: parsed.mode,
      provider: "client",
      model: "client",
      status: "completed",
      clientMessageId: parsed.clientMessageId,
    });

    if (parsed.stream) {
      const stream = new ReadableStream<Uint8Array>({
        start: async (controller) => {
          try {
            controller.enqueue(
              sseEvent("meta", {
                conversation,
                usage: {
                  requestCount: usageLimit.requestCount,
                  remaining: usageLimit.remaining,
                },
              }),
            );

            let streamResult: GenerateAiResponseResult | null = null;
            for await (const event of streamAiResponse({
              userMessage: parsed.message,
              mode: parsed.mode,
              conversationHistory: history,
              model: parsed.model,
              maxTokens: parsed.maxTokens,
              temperature: parsed.temperature,
            })) {
              if (event.type === "delta") {
                controller.enqueue(sseEvent("delta", { content: event.content }));
              } else if (event.type === "done") {
                streamResult = event.result;
              }
            }

            if (!streamResult) {
              throw new Error("EMPTY_STREAM_RESULT");
            }

            const { assistantMessage, usage } =
              await persistSuccessfulAssistantResponse({
                supabase,
                userId: user.id,
                conversation,
                mode: parsed.mode,
                ai: streamResult,
                usageRequestCount: usageLimit.requestCount,
                usageRemaining: usageLimit.remaining,
              });

            controller.enqueue(
              sseEvent("done", {
                conversation,
                message: assistantMessage,
                usage,
              }),
            );
            controller.close();
          } catch (streamError) {
            const errorMessage =
              streamError instanceof Error
                ? streamError.message
                : "UNKNOWN_AI_STREAM_ERROR";
            const clientMessage = toClientAiErrorMessage(errorMessage);
            console.error("[CHAT_STREAM] ERROR", errorMessage);

            try {
              await persistFailedAssistantResponse({
                supabase,
                userId: user.id,
                conversation,
                mode: parsed.mode,
                model: parsed.model,
                errorMessage,
              });
            } catch {
              // Ignore secondary persistence failures in stream error path.
            }

            controller.enqueue(
              sseEvent("error", {
                error: "AI_PROVIDER_ERROR",
                message: clientMessage,
                details:
                  process.env.NODE_ENV !== "production" ? errorMessage : undefined,
              }),
            );
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    try {
      const ai = await generateAiResponse({
        userMessage: parsed.message,
        mode: parsed.mode,
        conversationHistory: history,
        model: parsed.model,
        maxTokens: parsed.maxTokens,
        temperature: parsed.temperature,
      });

      const { assistantMessage, usage } = await persistSuccessfulAssistantResponse({
        supabase,
        userId: user.id,
        conversation,
        mode: parsed.mode,
        ai,
        usageRequestCount: usageLimit.requestCount,
        usageRemaining: usageLimit.remaining,
      });

      return NextResponse.json(
        {
          conversation,
          message: assistantMessage,
          usage,
        },
        { status: 201 },
      );
    } catch (aiError) {
      const errorMessage =
        aiError instanceof Error ? aiError.message : "UNKNOWN_AI_ERROR";
      const clientMessage = toClientAiErrorMessage(errorMessage);
      console.error("[CHAT_NON_STREAM] ERROR", errorMessage);

      await persistFailedAssistantResponse({
        supabase,
        userId: user.id,
        conversation,
        mode: parsed.mode,
        model: parsed.model,
        errorMessage,
      });

      return NextResponse.json(
        {
          error: "AI_PROVIDER_ERROR",
          message: clientMessage,
          details:
            process.env.NODE_ENV !== "production" ? errorMessage : undefined,
        },
        { status: 502 },
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_CHAT_ERROR";
    return NextResponse.json(
      { error: "FAILED_TO_PROCESS_CHAT", message },
      { status: 500 },
    );
  }
}
