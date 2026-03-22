"use client";

import { useState, type ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import { HeaderProvider, useHeader } from "@/components/layout/HeaderContext";

type MainLayoutProps = {
  children: ReactNode;
};

function MainLayoutContent({ children }: MainLayoutProps) {
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { title } = useHeader();

  return (
    <section className="min-h-screen bg-[#f7f7fb]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="sticky top-0 z-30 mb-4 flex items-center justify-between gap-4 bg-[#f7f7fb]/95 py-2 backdrop-blur supports-[backdrop-filter]:bg-[#f7f7fb]/60">
          <div className="flex items-center gap-3">
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
            onClick={() => setIsDesktopSidebarOpen(true)}
            aria-label="Show sidebar"
            className={cn(
              "hidden h-10 w-10 items-center justify-center rounded-full border border-[#d8e5dc] bg-white text-stone-700 transition hover:border-emerald-300 hover:text-emerald-700 lg:inline-flex",
              isDesktopSidebarOpen && "invisible",
            )}
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
          </div>

          {title ? (
            <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 truncate max-w-[200px] sm:max-w-md text-base font-medium text-stone-900">{title}</h1>
          ) : null}
        </div>

        <div
          className={cn(
            "grid gap-6",
            isDesktopSidebarOpen ? "lg:grid-cols-[280px_1fr]" : "lg:grid-cols-1",
          )}
        >
          {isDesktopSidebarOpen ? (
            <div className="hidden h-[calc(100vh-theme(spacing.32))] lg:block sticky top-24">
              <Sidebar
                showDismissButton={false}
                onDismiss={() => setIsDesktopSidebarOpen(false)}
                closeOnSelect={false}
              />
            </div>
          ) : null}
          <div className="min-w-0">{children}</div>
        </div>

        {isMobileSidebarOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-y-0 left-0 h-full w-[85%] max-w-sm shadow-xl animate-in slide-in-from-left duration-300">
              <div onClick={(event) => event.stopPropagation()} className="h-full">
                <Sidebar
                  showDismissButton
                  onDismiss={() => setIsMobileSidebarOpen(false)}
                  closeOnSelect={true}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <HeaderProvider>
      <MainLayoutContent>{children}</MainLayoutContent>
    </HeaderProvider>
  );
}
