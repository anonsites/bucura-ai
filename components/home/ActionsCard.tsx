"use client";

import { useEffect, useState } from "react";

const actions = [
  "summarizing.....",
  "reading.....",
  "thinking.......",
  "writing......",
  "coding......",
  "analysing.....",
  "shopping......",
];

export default function ActionCard() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < actions.length ? prev + 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-sm rounded-t-3xl bg-[#a8a38a] p-8 shadow-2xl transition-all">
      <h3 className="mb-6 text-3xl font-bold uppercase tracking-wide text-stone-900">
        let bucura do it for you
      </h3>
      <div className="flex min-h-[320px] flex-col gap-4">
        {actions.map((action, index) => {
          if (index > step) return null;
          const isDone = index < step;
          return (
            <div
              key={action}
              className="flex items-center gap-3 duration-300 animate-in fade-in slide-in-from-bottom-2"
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                  isDone
                    ? "border-stone-900 bg-stone-900 text-[#a8a38a]"
                    : "border-stone-700"
                }`}
              >
                {isDone && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`text-xl ${
                  isDone ? "text-stone-800" : "font-bold text-stone-900"
                }`}
              >
                {action}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
