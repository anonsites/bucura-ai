"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ChatMode } from "@/types/conversation";

type CreateConversationOptions = {
  title?: string;
  mode?: ChatMode;
};

export function useCreateConversation() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createConversation = async (options?: CreateConversationOptions) => {
    setError(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: options?.title || "ASK BUCURA",
          mode: options?.mode || "explanation",
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create chat.");
      setIsCreating(false); // Ensure loading state is reset on error
    }
  };

  return { createConversation, isCreating, error };
}
