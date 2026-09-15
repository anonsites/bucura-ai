import { buildSystemPrompt } from "@/lib/prompts";
import type { ChatMode } from "@/types/conversation";
import type { AiHistoryMessage } from "@/types/message";

type GeminiContent = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  modelVersion?: string;
};

type GeminiStreamChunk = GeminiResponse;

type GeminiRequest = {
  systemInstruction: { parts: Array<{ text: string }> };
  contents: GeminiContent[];
  generationConfig: {
    maxOutputTokens: number;
    temperature: number;
  };
};

type GeminiMessage = {
  role: "user" | "model";
  parts: Array<{ text: string }>;
};

type GeminiPrompt = {
  systemInstruction: { parts: Array<{ text: string }> };
  contents: GeminiMessage[];
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
  provider: "gemini";
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

function requireGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("Missing required environment variable: GEMINI_API_KEY");
  }
  return key;
}

function getDefaultModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

function buildGeminiPrompt(
  userMessage: string,
  mode: ChatMode,
  conversationHistory: AiHistoryMessage[],
): GeminiPrompt {
  const contents: GeminiMessage[] = conversationHistory.map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content }],
  }));
  contents.push({ role: "user", parts: [{ text: userMessage }] });

  return {
    systemInstruction: { parts: [{ text: buildSystemPrompt(mode) }] },
    contents,
  };
}

function getGeminiEndpoint(model: string, stream: boolean, apiKey: string): string {
  const action = stream ? "streamGenerateContent" : "generateContent";
  const query = stream ? "alt=sse&" : "";
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:${action}?${query}key=${encodeURIComponent(apiKey)}`;
}

function getText(payload: GeminiResponse): string {
  return (
    payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("") || ""
  );
}

export async function generateAiResponse({
  userMessage,
  mode,
  conversationHistory,
  model,
  maxTokens = 500,
  temperature = 0.4,
}: GenerateAiResponseParams): Promise<GenerateAiResponseResult> {
  const apiKey = requireGeminiApiKey();
  const selectedModel = model?.trim() || getDefaultModel();
  const prompt = buildGeminiPrompt(userMessage, mode, conversationHistory);

  const startedAt = Date.now();
  const response = await fetch(getGeminiEndpoint(selectedModel, false, apiKey), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...prompt,
      generationConfig: { maxOutputTokens: maxTokens, temperature },
    } satisfies GeminiRequest),
  });
  const latencyMs = Date.now() - startedAt;

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  const payload = (await response.json()) as GeminiResponse;
  const content = getText(payload).trim();

  if (!content) {
    throw new Error("Gemini returned an empty response.");
  }

  const promptTokens = payload.usageMetadata?.promptTokenCount ?? 0;
  const completionTokens = payload.usageMetadata?.candidatesTokenCount ?? 0;
  const totalTokens = payload.usageMetadata?.totalTokenCount ?? promptTokens + completionTokens;

  return {
    content,
    provider: "gemini",
    model: payload.modelVersion || selectedModel,
    promptTokens,
    completionTokens,
    totalTokens,
    latencyMs,
  };
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
  const apiKey = requireGeminiApiKey();
  const selectedModel = model?.trim() || getDefaultModel();
  const prompt = buildGeminiPrompt(userMessage, mode, conversationHistory);

  const startedAt = Date.now();
  const response = await fetch(getGeminiEndpoint(selectedModel, true, apiKey), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...prompt,
      generationConfig: { maxOutputTokens: maxTokens, temperature },
    } satisfies GeminiRequest),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
  }

  if (!response.body) {
    throw new Error("Gemini API did not return a readable stream.");
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

        let payload: GeminiStreamChunk;
        try {
          payload = JSON.parse(event.data) as GeminiStreamChunk;
        } catch {
          continue;
        }

        outputModel = payload.modelVersion || outputModel;

        const delta = getText(payload);
        if (delta) {
          content += delta;
          yield {
            type: "delta",
            content: delta,
          };
        }

        if (payload.usageMetadata) {
          promptTokens = payload.usageMetadata.promptTokenCount ?? promptTokens;
          completionTokens = payload.usageMetadata.candidatesTokenCount ?? completionTokens;
          totalTokens = payload.usageMetadata.totalTokenCount ?? totalTokens;
        }
      }
    }
  }

  const normalized = content.trim();
  if (!normalized) {
    throw new Error("Gemini returned an empty streamed response.");
  }

  const latencyMs = Date.now() - startedAt;
  const computedTotalTokens = totalTokens || promptTokens + completionTokens;

  yield {
    type: "done",
    result: {
      content: normalized,
      provider: "gemini",
      model: outputModel,
      promptTokens,
      completionTokens,
      totalTokens: computedTotalTokens,
      latencyMs,
    },
  };
}
