"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Text } from "@/components/ui/Text";
import Modal from "@/components/ui/Modal";
import ChatInput from "@/components/chat/ChatInput";
import Toaster from "@/components/ui/Toaster";
import { useToast } from "@/hooks/useToast";
import type { ChatMode } from "@/types/conversation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useHeader } from "@/components/layout/HeaderContext";

type Conversation = {
  id: string;
  title: string;
  mode: "exam" | "explanation" | "summary";
  messageCount: number;
  lastMessageAt: string | null;
  updatedAt: string;
};

type ConversationsResponse = {
  conversations?: Conversation[];
  message?: string;
};

function formatDate(value: string | null): string {
  if (!value) {
    return "No messages yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");
  const showChats = currentTab === "chats";
  const isHome = !currentTab;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [quickMode, setQuickMode] = useState<ChatMode>("explanation");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toasts, pushToast, dismissToast } = useToast();
  const { setTitle } = useHeader();

  const sortedConversations = useMemo(
    () =>
      [...conversations].sort((a, b) => {
        const aDate = new Date(a.lastMessageAt ?? a.updatedAt).getTime();
        const bDate = new Date(b.lastMessageAt ?? b.updatedAt).getTime();
        return bDate - aDate;
      }),
    [conversations],
  );

  const loadConversations = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/conversations", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const payload = (await response.json().catch(() => null)) as
        | ConversationsResponse
        | null;

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to load conversations.");
      }

      setConversations(payload?.conversations ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to fetch chats.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConversation = async () => {
    setErrorMessage(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "ASK BUCURA",
          mode: "explanation",
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { conversation?: { id: string }; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to create conversation.");
      }

      const conversationId = payload?.conversation?.id;
      if (!conversationId) {
        throw new Error("Conversation id was not returned.");
      }

      router.push(`/chat/${conversationId}`);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create chat.",
      );
      setIsCreating(false);
    }
  };

  const handleQuickAsk = async ({
    content,
    mode,
  }: {
    content: string;
    mode: ChatMode;
  }): Promise<boolean> => {
    const message = content.trim();
    if (!message) {
      return false;
    }

    setErrorMessage(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          mode,
          stream: false,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { conversation?: { id: string }; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to send message.");
      }

      const conversationId = payload?.conversation?.id;
      if (!conversationId) {
        throw new Error("Conversation id was not returned.");
      }

      router.push(`/chat/${conversationId}`);
      router.refresh();
      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to send message.",
      );
      setIsCreating(false);
      return false;
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationToDelete) {
      return;
    }

    const conversationId = conversationToDelete.id;
    setErrorMessage(null);
    setDeletingConversationId(conversationId);

    try {
      const response = await fetch(
        `/api/conversations?conversationId=${encodeURIComponent(conversationId)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        },
      );

      const payload = (await response.json().catch(() => null)) as
        | { message?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.message || "Failed to delete conversation.");
      }

      setConversations((current) =>
        current.filter((conversation) => conversation.id !== conversationId),
      );
      setConversationToDelete(null);
      pushToast({
        title: "Deleted",
        message: "Conversation deleted successfully.",
        variant: "success",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete conversation.",
      );
    } finally {
      setDeletingConversationId(null);
    }
  };

  useEffect(() => {
    if (showChats) {
      setTitle("Chats");
    } else {
      setTitle(null);
    }
  }, [showChats, setTitle]);

  useEffect(() => {
    if (!showChats) {
      return;
    }
    void loadConversations();
  }, [showChats]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(" ")[0]);
      }
    };
    void getUser();
  }, []);

  return (
    <main className={!isHome ? "space-y-6" : "flex min-h-[72vh] items-center"}>
      {isHome ? (
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-6 flex justify-center">
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-white/50 bg-[#8a8ba8] shadow-lg">
              <Image
                src="/images/bucura-ai.png"
                alt="Bucura AI Logo"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <h1 className="mb-8 text-center text-4xl sm:text-5xl">ASK BUCURA</h1>
          <section className="card border-[#dce8df] bg-white">
            <div className="space-y-5">
              <div>
                {userName ? (
                  <h2 className="text-center text-stone-800">
                    Hey {userName},
                  </h2>
                ) : null}
                <Text size="base" className="mt-3 text-center text-stone-900">
                  How can I help you today?
                </Text>
              </div>

              <ChatInput
                onSubmit={handleQuickAsk}
                disabled={isCreating}
                mode={quickMode}
                onModeChange={setQuickMode}
                placeholder="Ask Bucura anything..."
                onExtensionClick={() => {
                  pushToast({
                    title: "Coming Soon",
                    message: "Attachments are not available yet.",
                    variant: "info",
                  });
                }}
              />
            </div>
          </section>
        </div>
      ) : null}

      {errorMessage ? (
        <section className="card border-red-200 bg-red-50">
          <h2 className="text-2xl text-red-700">Something went wrong</h2>
          <Text size="base" className="mt-2 text-red-700">
            {errorMessage}
          </Text>
          {showChats ? (
            <button
              type="button"
              onClick={loadConversations}
              className="mt-4 rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
            >
              Retry
            </button>
          ) : null}
        </section>
      ) : null}

      {showChats ? (
        <section className="card border-[#dce8df] bg-white">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-3xl">Chats</h2>
            <Text size="sm" className="text-stone-700">
              {sortedConversations.length} total
            </Text>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="h-16 animate-pulse rounded-lg border border-[#e5ece7] bg-[#f5f8f6]"
                />
              ))}
            </div>
          ) : null}

          {!isLoading && sortedConversations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#cedbd2] bg-[#f8fcf9] p-6 text-center">
              <h3 className="text-2xl">No chats yet</h3>
              <Text size="base" className="mt-2 text-stone-900">
                Ask BUCURA to get started
              </Text>
              <button
                type="button"
                onClick={handleCreateConversation}
                disabled={isCreating}
                className="btn-primary mt-4 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? "Creating..." : "Create First Chat"}
              </button>
            </div>
          ) : null}

          {!isLoading && sortedConversations.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-[#dce8df] bg-white">
              {sortedConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center justify-between gap-3 border-b border-[#e8efea] px-4 py-3 transition last:border-b-0 hover:bg-[#f7fbf9]"
                >
                  <Link
                    href={`/chat/${conversation.id}`}
                    className="min-w-0 flex-1"
                  >
                    <p className="truncate text-base font-normal text-stone-900">
                      {conversation.title || "Untitled conversation"}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs font-medium text-stone-700">
                        {conversation.messageCount} messages
                      </span>
                    </div>
                  </Link>

                  <div className="ml-3 flex shrink-0 items-center gap-3">
                    <Text size="sm" className="text-stone-700">
                      {formatDate(conversation.lastMessageAt)}
                    </Text>
                    <button
                      type="button"
                      onClick={() => {
                        setConversationToDelete(conversation);
                      }}
                      disabled={deletingConversationId === conversation.id}
                      aria-label="Delete conversation"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-4 w-4"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2m-1 0v13a1 1 0 01-1 1H10a1 1 0 01-1-1V6" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <Modal
        isOpen={Boolean(conversationToDelete)}
        onClose={() => {
          if (!deletingConversationId) {
            setConversationToDelete(null);
          }
        }}
      >
        <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-xl">
          <h3 className="text-2xl text-stone-900">Delete conversation?</h3>
          <Text size="base" className="mt-2 text-stone-700">
            This action cannot be undone.
          </Text>
          <div className="mt-2 rounded-lg bg-[#f5f8f6] px-3 py-2">
            <p className="truncate text-sm text-stone-800">
              {conversationToDelete?.title || "Untitled conversation"}
            </p>
          </div>
          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConversationToDelete(null)}
              disabled={Boolean(deletingConversationId)}
              className="rounded-full border border-[#d8e5dc] bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleDeleteConversation()}
              disabled={Boolean(deletingConversationId)}
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deletingConversationId ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>

      <Toaster toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}

function DashboardPageFallback() {
  return (
    <main className="flex min-h-[72vh] items-center">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="mb-8 text-center text-4xl sm:text-5xl">Ask BUCURA</h1>
        <section className="card border-[#dce8df] bg-white">
          <div className="space-y-5">
            <div>
              <Text size="base" className="mt-3 text-center text-stone-900">
                Loading dashboard...
              </Text>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardPageFallback />}>
      <DashboardPageContent />
    </Suspense>
  );
}
