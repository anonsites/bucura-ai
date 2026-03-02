"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ChatInput from "@/components/chat/ChatInput";
import MessageBubble, { type ChatBubbleMessage } from "@/components/chat/MessageBubble";
import { Text } from "@/components/ui/Text";
import Toaster from "@/components/ui/Toaster";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { isChatMode, type ChatMode } from "@/types/conversation";
import type { MessageStatus } from "@/types/message";

type ChatPageClientProps = {
  initialConversationId: string;
};

type ApiConversation = {
  id: string;
  title: string;
  mode: ChatMode;
};

type ApiMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  mode: ChatMode;
  status: MessageStatus;
  createdAt: string;
};

type ChatLoadResponse = {
  conversation?: ApiConversation;
  messages?: ApiMessage[];
  message?: string;
};

type ChatSendResponse = {
  conversation?: ApiConversation;
  message?: ApiMessage;
  error?: string;
  usage?: {
    requestCount: number;
    remaining: number;
  };
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function toBubbleMessage(message: ApiMessage): ChatBubbleMessage | null {
  if (message.role !== "user" && message.role !== "assistant") {
    return null;
  }

  return {
    id: message.id,
    role: message.role,
    content: message.content,
    mode: message.mode,
    status: message.status,
    createdAt: message.createdAt,
  };
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "details" in payload &&
    typeof payload.details === "string" &&
    payload.details.trim()
  ) {
    return payload.details;
  }
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string" &&
    payload.message.trim()
  ) {
    return payload.message;
  }
  return fallback;
}

type SseEvent = {
  event: string;
  data: string;
};

function parseSseBlock(rawBlock: string): SseEvent | null {
  const lines = rawBlock.split("\n");
  let event = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  return {
    event,
    data: dataLines.join("\n"),
  };
}

export default function ChatPageClient({
  initialConversationId,
}: ChatPageClientProps) {
  const router = useRouter();
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isNewRoute = initialConversationId === "new";
  const isExistingConversation = isUuid(initialConversationId);
  const isInvalidRoute = !isNewRoute && !isExistingConversation;

  const [conversationId, setConversationId] = useState<string | null>(
    isExistingConversation ? initialConversationId : null,
  );
  const [title, setTitle] = useState("NEW CHAT");
  const [mode, setMode] = useState<ChatMode>("explanation");
  const [messages, setMessages] = useState<ChatBubbleMessage[]>([]);
  const [isLoading, setIsLoading] = useState(isExistingConversation);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const { toasts, pushToast, dismissToast } = useToast();

  const canSend = useMemo(
    () => !isInvalidRoute && !isLoading && !isSending,
    [isInvalidRoute, isLoading, isSending],
  );

  useEffect(() => {
    if (!isExistingConversation) {
      return;
    }

    let isCancelled = false;
    const loadConversation = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(
          `/api/chat?conversationId=${encodeURIComponent(initialConversationId)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );

        const payload = (await response.json().catch(() => null)) as
          | ChatLoadResponse
          | null;

        if (!response.ok) {
          throw new Error(
            getErrorMessage(payload, "Failed to load this conversation."),
          );
        }

        if (isCancelled) {
          return;
        }

        const fetchedConversation = payload?.conversation;
        const fetchedMessages = payload?.messages ?? [];
        const parsedMessages = fetchedMessages
          .map(toBubbleMessage)
          .filter((item): item is ChatBubbleMessage => item !== null);

        if (fetchedConversation) {
          setConversationId(fetchedConversation.id);
          setTitle(fetchedConversation.title || "NEW CHAT");
          if (isChatMode(fetchedConversation.mode)) {
            setMode(fetchedConversation.mode);
          }
        }

        setMessages(parsedMessages);
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to open this conversation.",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadConversation();

    return () => {
      isCancelled = true;
    };
  }, [initialConversationId, isExistingConversation]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleCopyAssistantMessage = async (message: ChatBubbleMessage) => {
    if (message.role !== "assistant" || message.status !== "completed") {
      return;
    }

    if (!navigator.clipboard?.writeText) {
      setErrorMessage("Clipboard copy is not supported in this browser.");
      return;
    }

    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessageId(message.id);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedMessageId((current) =>
          current === message.id ? null : current,
        );
      }, 1600);
    } catch {
      setErrorMessage("Failed to copy message.");
    }
  };

  const handleSendMessage = async ({
    content,
    mode: selectedMode,
  }: {
    content: string;
    mode: ChatMode;
  }): Promise<boolean> => {
    if (!canSend) {
      return false;
    }

    setIsSending(true);
    setErrorMessage(null);

    const now = new Date().toISOString();
    const userMessageId = `temp-user-${crypto.randomUUID()}`;
    const pendingAssistantId = `temp-assistant-${crypto.randomUUID()}`;
    const clientMessageId = crypto.randomUUID();

    const userMessage: ChatBubbleMessage = {
      id: userMessageId,
      role: "user",
      content,
      mode: selectedMode,
      status: "completed",
      createdAt: now,
    };

    const pendingAssistant: ChatBubbleMessage = {
      id: pendingAssistantId,
      role: "assistant",
      content: "",
      mode: selectedMode,
      status: "pending",
      createdAt: now,
    };

    setMessages((current) => [...current, userMessage, pendingAssistant]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationId ?? undefined,
          message: content,
          mode: selectedMode,
          clientMessageId,
          stream: true,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | ChatSendResponse
          | null;
        throw new Error(getErrorMessage(payload, "Unable to send your message."));
      }

      if (!response.body) {
        throw new Error("Empty stream response from server.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalAssistantMessage: ApiMessage | null = null;

      const setConversationFromPayload = (candidate?: ApiConversation) => {
        if (!candidate) {
          return;
        }
        setConversationId(candidate.id);
        setTitle(candidate.title || "NEW CHAT");
        if (isChatMode(candidate.mode)) {
          setMode(candidate.mode);
        }
        if (isNewRoute) {
          router.replace(`/chat/${candidate.id}`);
        }
      };

      const appendDelta = (chunk: string) => {
        if (!chunk) {
          return;
        }
        setMessages((current) =>
          current.map((item) =>
            item.id === pendingAssistantId
              ? { ...item, content: `${item.content}${chunk}` }
              : item,
          ),
        );
      };

      const processEvent = (rawBlock: string) => {
        const parsedEvent = parseSseBlock(rawBlock);
        if (!parsedEvent || parsedEvent.data === "[DONE]") {
          return;
        }

        let payload: unknown;
        try {
          payload = JSON.parse(parsedEvent.data) as unknown;
        } catch {
          return;
        }

        if (parsedEvent.event === "meta") {
          if (
            payload &&
            typeof payload === "object" &&
            "conversation" in payload &&
            payload.conversation &&
            typeof payload.conversation === "object"
          ) {
            setConversationFromPayload(payload.conversation as ApiConversation);
          }
          return;
        }

        if (parsedEvent.event === "delta") {
          if (
            payload &&
            typeof payload === "object" &&
            "content" in payload &&
            typeof payload.content === "string"
          ) {
            appendDelta(payload.content);
          }
          return;
        }

        if (parsedEvent.event === "done") {
          const donePayload = payload as ChatSendResponse;
          setConversationFromPayload(donePayload.conversation);
          if (donePayload.message) {
            finalAssistantMessage = donePayload.message;
          }
          return;
        }

        if (parsedEvent.event === "error") {
          throw new Error(getErrorMessage(payload, "Unable to stream response."));
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const rawBlocks = buffer.split("\n\n");
        buffer = rawBlocks.pop() ?? "";

        for (const rawBlock of rawBlocks) {
          processEvent(rawBlock);
        }
      }

      if (buffer.trim()) {
        processEvent(buffer);
      }

      setMessages((current) => {
        const withoutPending = current.filter(
          (item) => item.id !== pendingAssistantId,
        );

        if (finalAssistantMessage) {
          const assistantBubble = toBubbleMessage(finalAssistantMessage);
          if (assistantBubble) {
            return [...withoutPending, assistantBubble];
          }
        }

        const pending = current.find((item) => item.id === pendingAssistantId);
        if (pending && pending.content.trim()) {
          return [
            ...withoutPending,
            {
              ...pending,
              status: "completed",
            },
          ];
        }

        return withoutPending;
      });

      router.refresh();
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to send message.";
      setErrorMessage(message);

      setMessages((current) =>
        current.map((item) => {
          if (item.id !== pendingAssistantId) {
            return item;
          }
          return {
            ...item,
            status: "error",
            content:
              "Sorry! something went wrong. Please check your internet connection and try again.",
          };
        }),
      );
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#f7f7fb]">
      <div className="sticky top-0 z-10 border-b border-[#e5ece7] bg-[#f7f7fb]/80 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full border border-[#d8e5dc] px-3 py-1 text-xs font-semibold tracking-wide uppercase text-stone-700 transition hover:border-emerald-300 hover:text-emerald-700"
          >
            Back
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 pb-40 space-y-6">
        {isInvalidRoute ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <Text size="base" className="text-red-700">
              Something went wrong! start a new chat
            </Text>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <Text size="base" className="text-red-700">
              {errorMessage}
            </Text>
          </div>
        ) : null}

        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`chat-skeleton-${index}`}
                className={cn(
                  "h-16 animate-pulse rounded-2xl border border-white/70 bg-white/80",
                  index % 2 === 0 ? "mr-12" : "ml-12",
                )}
              />
            ))}
          </div>
        ) : null}

        {!isLoading &&
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isCopied={copiedMessageId === message.id}
              onCopy={handleCopyAssistantMessage}
            />
          ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#f7f7fb] via-[#f7f7fb] to-transparent pb-6 pt-10">
        <div className="mx-auto max-w-3xl px-4">
          <ChatInput
            onSubmit={handleSendMessage}
            disabled={!canSend}
            mode={mode}
            onModeChange={setMode}
            onExtensionClick={() => {
              pushToast({
                title: "Coming Soon",
                message: "More features are under development...",
                variant: "info",
              });
            }}
          />
        </div>
      </div>
      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}
