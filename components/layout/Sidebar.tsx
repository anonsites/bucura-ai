"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/utils";
import { useCreateConversation } from "@/components/chat/useCreateConversation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const navItems = [
  { href: "/dashboard?tab=chats", label: "Chats", key: "chats" },
  { href: "/settings", label: "Settings" },
  { href: "/feedback", label: "Feedback" },
];

type SidebarProps = {
  showDismissButton?: boolean;
  onDismiss?: () => void;
};

function SidebarContent({
  showDismissButton = false,
  onDismiss,
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { createConversation, isCreating, error } = useCreateConversation();
  const currentTab = searchParams.get("tab");
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        const name = user.user_metadata.full_name.split(" ")[0];
        setUserName(name.charAt(0).toUpperCase() + name.slice(1));
      }
    };
    void getUser();
  }, []);

  return (
    <aside className="card h-fit border-[#d9e4dc] bg-[#a8a38a]">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h2 className="truncate text-3xl leading-none">
            {userName}
          </h2>
          <Text size="sm" className="mt-1 text-stone-700">
            Your workspace
          </Text>
        </div>
        {showDismissButton ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close sidebar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d8e5dc] bg-white text-stone-700 transition hover:border-emerald-300 hover:text-emerald-700"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        ) : null}
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const isChatsTabActive =
            item.key === "chats" &&
            pathname === "/dashboard" &&
            currentTab === "chats";

          const isActive =
            isChatsTabActive ||
            (item.key !== "chats" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-bold transition",
                isActive
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-transparent bg-white text-stone-700 hover:border-[#d7e1da] hover:bg-[#fbfdfc]",
              )}
            >
              <span>{item.label}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4 opacity-50"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-[#e5ece7] pt-5">
        <button
          type="button"
          onClick={() => createConversation()}
          disabled={isCreating}
          className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreating ? "Creating..." : "Start New Chat"}
        </button>
        {error ? (
          <Text size="sm" className="mt-2 text-red-600">
            {error}
          </Text>
        ) : null}
      </div>
    </aside>
  );
}

export default function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<aside className="card h-fit border-[#d9e4dc] bg-gradient-to-b from-white to-[#f4fbf7] min-h-[200px]" />}>
      <SidebarContent {...props} />
    </Suspense>
  );
}
