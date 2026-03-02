import { buildSystemPrompt } from "@/lib/prompts";
import type { ChatMode } from "@/types/conversation";
import type { AiHistoryMessage } from "@/types/message";

type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const LEGACY_MODEL_ALIASES: Record<string, string> = {
  "llama3-8b-8192": "llama-3.1-8b-instant",
  "llama3-70b-8192": "llama-3.3-70b-versatile",
};

type GroqCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model?: string;
};

type GroqStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  x_groq?: {
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };
  model?: string;
};

export type GenerateAiResponseParams = {
  userMessage: string;
  mode: ChatMode;
  conversationHistory: AiHistoryMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
};

export type GenerateAiResponseResult = {
  content: string;
  provider: "groq";
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
};

export type StreamAiResponseEvent =
  | {
      type: "delta";
      content: string;
    }
  | {
      type: "done";
      result: GenerateAiResponseResult;
    };

function requireGroqApiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("Missing required environment variable: GROQ_API_KEY");
  }
  return key;
}

function resolveModelName(model: string): string {
  const normalized = model.trim();
  return LEGACY_MODEL_ALIASES[normalized] ?? normalized;
}

function getDefaultModel(): string {
  return resolveModelName(process.env.GROQ_MODEL?.trim() || "llama-3.1-8b-instant");
}

function buildGroqMessages(
  userMessage: string,
  mode: ChatMode,
  conversationHistory: AiHistoryMessage[],
): GroqMessage[] {
  return [
    { role: "system", content: buildSystemPrompt(mode) },
    ...conversationHistory.map((item) => ({
      role: item.role,
      content: item.content,
    })),
    { role: "user", content: userMessage },
  ];
}

export async function generateAiResponse({
  userMessage,
  mode,
  conversationHistory,
  model,
  maxTokens = 500,
  temperature = 0.4,
}: GenerateAiResponseParams): Promise<GenerateAiResponseResult> {
  const apiKey = requireGroqApiKey();
  const selectedModel = resolveModelName(model?.trim() || getDefaultModel());
  const messages = buildGroqMessages(userMessage, mode, conversationHistory);

  const startedAt = Date.now();
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: selectedModel,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: false,
    }),
  });
  const latencyMs = Date.now() - startedAt;

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorBody}`);
  }

  const payload = (await response.json()) as GroqCompletionResponse;
  const content = payload.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("Groq returned an empty response.");
  }

  const promptTokens = payload.usage?.prompt_tokens ?? 0;
  const completionTokens = payload.usage?.completion_tokens ?? 0;
  const totalTokens = payload.usage?.total_tokens ?? promptTokens + completionTokens;

  return {
    content,
    provider: "groq",
    model: payload.model || selectedModel,
    promptTokens,
    completionTokens,
    totalTokens,
    latencyMs,
  };
}

function extractUsage(payload: GroqStreamChunk) {
  return payload.usage ?? payload.x_groq?.usage;
}

function parseSseEvents(rawBlock: string): Array<{ event: string; data: string }> {
  const lines = rawBlock.split("\n");
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (dataLines.length === 0) {
    return [];
  }

  return [{ event: eventName, data: dataLines.join("\n") }];
}

export async function* streamAiResponse({
  userMessage,
  mode,
  conversationHistory,
  model,
  maxTokens = 500,
  temperature = 0.4,
}: GenerateAiResponseParams): AsyncGenerator<StreamAiResponseEvent> {
  const apiKey = requireGroqApiKey();
  const selectedModel = resolveModelName(model?.trim() || getDefaultModel());
  const messages = buildGroqMessages(userMessage, mode, conversationHistory);

  const startedAt = Date.now();
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: selectedModel,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
      stream_options: {
        include_usage: true,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errorBody}`);
  }

  if (!response.body) {
    throw new Error("Groq API did not return a readable stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let content = "";
  let outputModel = selectedModel;
  let promptTokens = 0;
  let completionTokens = 0;
  let totalTokens = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const rawBlocks = buffer.split("\n\n");
    buffer = rawBlocks.pop() ?? "";

    for (const rawBlock of rawBlocks) {
      const events = parseSseEvents(rawBlock);
      for (const event of events) {
        if (event.data === "[DONE]") {
          continue;
        }

        let payload: GroqStreamChunk;
        try {
          payload = JSON.parse(event.data) as GroqStreamChunk;
        } catch {
          continue;
        }

        outputModel = payload.model || outputModel;

        const delta = payload.choices?.[0]?.delta?.content || "";
        if (delta) {
          content += delta;
          yield {
            type: "delta",
            content: delta,
          };
        }

        const usage = extractUsage(payload);
        if (usage) {
          promptTokens = usage.prompt_tokens ?? promptTokens;
          completionTokens = usage.completion_tokens ?? completionTokens;
          totalTokens = usage.total_tokens ?? totalTokens;
        }
      }
    }
  }

  const normalized = content.trim();
  if (!normalized) {
    throw new Error("Groq returned an empty streamed response.");
  }

  const latencyMs = Date.now() - startedAt;
  const computedTotalTokens = totalTokens || promptTokens + completionTokens;

  yield {
    type: "done",
    result: {
      content: normalized,
      provider: "groq",
      model: outputModel,
      promptTokens,
      completionTokens,
      totalTokens: computedTotalTokens,
      latencyMs,
    },
  };
}
