"use client";

import { useState } from "react";
import Image from "next/image";
import ActionCard from "@/components/home/ActionsCard";
import Footer from "@/components/layout/Footer";
import SignUpModal from "@/components/auth/SignUpModal";
import LoginModal from "@/components/auth/LoginModal";

type HomePageClientProps = {
  initialAuthMode: "login" | "signup" | null;
  redirectTo: string;
};

export default function HomePageClient({
  initialAuthMode,
  redirectTo,
}: HomePageClientProps) {
  const [isSignUpOpen, setIsSignUpOpen] = useState(initialAuthMode === "signup");
  const [isLoginOpen, setIsLoginOpen] = useState(initialAuthMode === "login");

  return (
    <main className="relative flex min-h-screen flex-col overflow-x-hidden bg-white text-stone-900">
      <div className="absolute left-1/2 top-1/2 z-0 h-[640px] w-[320px] -translate-x-1/2 -translate-y-1/2">
        <Image
          src="/images/hero_section.png"
          alt="Hero Background"
          fill
          className="object-cover opacity-50"
          priority
        />
      </div>
      <div className="container relative z-10 mx-auto flex min-h-screen flex-col justify-between gap-12 px-4 pt-10 md:flex-row md:gap-0">
        <div className="flex w-full flex-col items-center justify-center text-center md:my-auto md:w-1/2 md:items-start md:text-left">
          <div className="relative mt-12 rounded-3xl border border-white/20 bg-white/30 p-12 shadow-xl backdrop-blur-md md:mt-0">
            <div className="absolute -top-10 left-1/2 h-20 w-20 -translate-x-1/2 overflow-hidden rounded-full border-4 border-white/50 bg-[#8a8ba8] shadow-lg md:-top-12 md:left-12 md:h-24 md:w-24 md:translate-x-0">
              <Image
                src="/images/bucura-ai.png"
                alt="Bucura AI Logo"
                fill
                className="object-cover"
              />
            </div>
            <h1 className="text-7xl font-bold tracking-wider md:text-9xl">
              BUCURA AI
            </h1>
            <p className="mt-2 text-lg font-bold text-stone-700 md:text-xl">
              Assistant for complex tasks.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 md:justify-start">
              <button
                type="button"
                onClick={() => setIsSignUpOpen(true)}
                className="btn-primary font-bold"
              >
                Try It
              </button>
              <button
                type="button"
                onClick={() => setIsLoginOpen(true)}
                className="inline-flex h-10 items-center font-bold justify-center rounded-full border border-gray-600 bg-transparent px-6 text-sm text-stone-900 transition-colors hover:bg-stone-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 z-20 mt-auto flex w-full justify-center md:static md:flex md:w-1/2 md:items-end md:justify-end">
          <ActionCard />
        </div>
      </div>
      <Footer />
      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
        redirectTo={redirectTo}
        onSwitchToLogin={() => {
          setIsSignUpOpen(false);
          setIsLoginOpen(true);
        }}
      />
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        redirectTo={redirectTo}
        onSwitchToSignUp={() => {
          setIsLoginOpen(false);
          setIsSignUpOpen(true);
        }}
      />
    </main>
  );
}
