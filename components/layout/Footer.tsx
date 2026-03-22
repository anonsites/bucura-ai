"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DonateModal from "@/components/common/DonateModal";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function Footer() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          setDeferredPrompt(null);
        }
      });
    }
  };

  return (
    <footer className="relative z-10 mt-6 border-t border-white/40 bg-[#a8a38a] py-10 text-stone-900 backdrop-blur">
      <div className="container mx-auto flex flex-col items-center justify-center gap-6 px-4">
        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium">
          <Link href="/documentation" className="font-extrabold hover:text-emerald-700 hover:underline">
            Documentation
          </Link>
          <Link href="/policy" className="font-extrabold hover:text-emerald-700 hover:underline">
            Privacy Policy
          </Link>
          <Link href="/terms" className="font-extrabold hover:text-emerald-700 hover:underline">
            Terms of Service
          </Link>
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="rounded-full bg-black px-4 py-2 text-xs font-bold text-white transition hover:bg-stone-800"
            >
              Download App
            </button>
          )}
        </nav>
      </div>
    </footer>
  );
}
