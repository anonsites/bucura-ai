"use client";

import Link from "next/link";

export default function MarqueeAnnouncement() {
  return (
    <div className="relative z-50 flex h-12 w-full items-center overflow-hidden bg-stone-900 text-sm font-medium text-stone-200">
      {/* Marquee Container */}
      <div className="flex min-w-full overflow-hidden">
        <div className="animate-marquee flex shrink-0 items-center whitespace-nowrap">
          <span className="mx-4">Introducing Bucura AI customer support chatbot</span>
          <span className="mx-4">Introducing Bucura AI customer support chatbot</span>
          <span className="mx-4">Introducing Bucura AI customer support chatbot</span>
          <span className="mx-4">Introducing Bucura AI customer support chatbot</span>
        </div>
        <div className="animate-marquee flex shrink-0 items-center whitespace-nowrap" aria-hidden="true">
          <span className="mx-4">Introducing Bucura AI customer support chatbot</span>
          <span className="mx-4">Introducing Bucura AI customer support chatbot</span>
          <span className="mx-4">Introducing Bucura AI customer support chatbot</span>
          <span className="mx-4">Introducing Bucura AI customer support chatbot</span>
        </div>
      </div>

      {/* Fixed 'Learn more' Button Area with fade/shadow effect for "slide under" */}
      <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center bg-stone-900 pl-6 shadow-[-15px_0_15px_-5px_rgba(28,25,23,1)]">
        <Link
          href="/documentation"
          className="mr-3 rounded-full bg-emerald-400 px-4 py-1.5 text-xs font-bold text-stone-900 transition hover:bg-emerald-300 whitespace-nowrap"
        >
          Learn more
        </Link>
      </div>

      <style jsx>{`
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}