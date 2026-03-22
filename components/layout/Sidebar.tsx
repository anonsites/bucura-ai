"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/utils";
import { useCreateConversation } from "@/components/chat/useCreateConversation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const navItems = [
  { href: "/dashboard?tab=chats", label: "Chats", key: "chats" },
  { href: "/settings", label: "Settings", key: "settings" },
  { href: "/feedback", label: "Feedback", key: "feedback" },
];

type SidebarProps = {
  showDismissButton?: boolean;
  onDismiss?: () => void;
  closeOnSelect?: boolean;
};

function SidebarContent({
  showDismissButton = false,
  onDismiss,
  closeOnSelect,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { createConversation, isCreating, error } = useCreateConversation();
  const currentTab = searchParams.get("tab");
  const [userName, setUserName] = useState<string | null>(null);
  const [isDeveloper, setIsDeveloper] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        if (user.user_metadata?.full_name) {
          const name = user.user_metadata.full_name.split(" ")[0];
          setUserName(name.charAt(0).toUpperCase() + name.slice(1));
        }
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile?.role === "developer") {
          setIsDeveloper(true);
        }
      }
    };
    void getUser();
  }, []);

  const handleNavClick = () => {
    if (closeOnSelect && onDismiss) {
      onDismiss();
    }
  };

  const handleLogout = async () => {
    if (closeOnSelect && onDismiss) {
      onDismiss();
    }
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="card flex h-full flex-col overflow-y-auto border-[#d9e4dc] bg-[#f8fcf9] p-4 lg:bg-gradient-to-b lg:from-white lg:to-[#f4fbf7]">
      <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-6 flex items-start justify-between gap-3 bg-[#f8fcf9] px-4 pt-4 lg:bg-white/80 lg:backdrop-blur-md">
        <div>
          <h2 className="truncate text-2xl font-bold leading-none text-stone-900 lg:text-3xl">
            {userName || "Guest"}
          </h2>
          <Text size="sm" className="mt-1 text-stone-700">
            Your workspace
          </Text>
        </div>
        {onDismiss ? (
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

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive =
            (item.href.includes("?tab=") && item.key === currentTab) ||
            (!item.href.includes("?tab=") && pathname.startsWith(item.href)) ||
            (item.key === "chats" && pathname.startsWith("/chat/"));

          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                "flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-bold transition",
                isActive
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-transparent bg-white text-stone-600 hover:border-[#d7e1da] hover:bg-[#fbfdfc] hover:text-stone-900",
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

        {isDeveloper && (
          <Link
            href="/developers"
            onClick={handleNavClick}
            className={cn(
              "flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-bold transition",
              pathname.startsWith("/developers")
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-transparent bg-white text-stone-600 hover:border-[#d7e1da] hover:bg-[#fbfdfc] hover:text-stone-900",
            )}
          >
            <span>Projects</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 opacity-50"
            >
              <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4z" />
            </svg>
          </Link>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-between rounded-xl border border-transparent bg-white px-3 py-2 text-sm font-bold text-stone-600 transition hover:border-[#d7e1da] hover:bg-[#fbfdfc] hover:text-stone-900"
        >
          <span>Log out</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 opacity-50"
          >
            <path
              fillRule="evenodd"
              d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
              clipRule="evenodd"
            />
          </svg>
        </button>
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
    <Suspense fallback={<aside className="card h-full min-h-[400px] border-[#d9e4dc] bg-white" />}>
      <SidebarContent {...props} />
    </Suspense>
  );
}
