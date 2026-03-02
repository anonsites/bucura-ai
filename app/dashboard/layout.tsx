"use client";

import { useState, type ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <section className="min-h-screen bg-[#f7f7fb]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            aria-label="Open sidebar"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d8e5dc] bg-white text-stone-700 transition hover:border-emerald-300 hover:text-emerald-700 lg:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setIsDesktopSidebarOpen((current) => !current)}
            aria-label={isDesktopSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-[#d8e5dc] bg-white text-stone-700 transition hover:border-emerald-300 hover:text-emerald-700 lg:inline-flex"
          >
            {isDesktopSidebarOpen ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>

        <div
          className={cn(
            "grid gap-6",
            isDesktopSidebarOpen ? "lg:grid-cols-[280px_1fr]" : "lg:grid-cols-1",
          )}
        >
          {isDesktopSidebarOpen ? (
            <div className="hidden lg:block">
              <Sidebar
                showDismissButton
                onDismiss={() => setIsDesktopSidebarOpen(false)}
              />
            </div>
          ) : null}
          <div className="min-w-0">{children}</div>
        </div>

        {isMobileSidebarOpen ? (
          <div className="fixed inset-0 z-50 bg-black/50 lg:hidden">
            <button
              type="button"
              aria-label="Close sidebar overlay"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="absolute inset-0 h-full w-full cursor-default"
            />
            <div className="relative h-full w-[90%] max-w-sm p-4">
              <div onClick={(event) => event.stopPropagation()}>
                <Sidebar
                  showDismissButton
                  onDismiss={() => setIsMobileSidebarOpen(false)}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
