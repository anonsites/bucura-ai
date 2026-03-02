"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/utils";
import type { ChatMode } from "@/types/conversation";
import type { MessageStatus } from "@/types/message";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type ChatBubbleMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: MessageStatus | "pending";
  createdAt: string;
  mode: ChatMode;
};

type MessageBubbleProps = {
  message: ChatBubbleMessage;
  isCopied?: boolean;
  onCopy?: (message: ChatBubbleMessage) => void;
};

type CodeBlockProps = {
  code: string;
  className?: string;
};

function extractLanguage(className?: string): string | null {
  if (!className) {
    return null;
  }
  const match = className.match(/language-([a-zA-Z0-9]+)/);
  return match?.[1] ?? null;
}

function CodeBlock({ code, className }: CodeBlockProps) {
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const language = extractLanguage(className);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyCode = async () => {
    if (!navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setIsCopied(false);
      }, 1400);
    } catch {
      setIsCopied(false);
    }
  };

  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-[#dce8df] bg-[#0f172a] last:mb-0">
      <div className="flex items-center justify-between border-b border-[#1f2937] bg-[#111827] px-3 py-1.5">
        <span className="text-[10px] font-semibold tracking-wide uppercase text-slate-300">
          {language ?? "code"}
        </span>
        <button
          type="button"
          onClick={() => void handleCopyCode()}
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase transition",
            isCopied
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-slate-500 bg-transparent text-slate-300 hover:border-emerald-300 hover:text-emerald-200",
          )}
        >
          {isCopied ? "Copied" : "Copy code"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-sm text-emerald-100">
        <code className={cn("font-mono", className)}>{code}</code>
      </pre>
    </div>
  );
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-2">
      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-600 [animation-delay:-0.3s]" />
      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-600 [animation-delay:-0.15s]" />
      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-600" />
    </div>
  );
}

export default function MessageBubble({
  message,
  isCopied = false,
  onCopy,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isError = message.status === "error";
  const isPending = message.status === "pending";
  const hasFencedCodeBlock = /```[\s\S]*```/m.test(message.content);

  return (
    <article className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[96%] rounded-2xl border px-4 py-3 shadow-sm sm:max-w-[88%]",
          isUser
            ? "border-emerald-600 bg-emerald-600 text-white"
            : "border-[#dce8df] bg-white text-stone-900",
          isError && "border-red-300 bg-red-50 text-red-800",
        )}
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <span
            className={cn(
              "text-[10px] font-semibold tracking-[0.12em] uppercase",
              isUser ? "text-emerald-100" : "text-stone-500",
              isError && "text-red-700",
            )}
          >
            {isUser ? "You" : "Bucura AI"}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-medium",
                isUser ? "text-emerald-100" : "text-stone-500",
                isError && "text-red-700",
              )}
            >
              {formatTime(message.createdAt)}
            </span>
          </div>
        </div>
        <Text
          size="base"
          className={cn(
            "whitespace-pre-wrap break-words leading-normal",
            isUser ? "text-white" : "text-stone-900",
            isError && "text-red-800",
            !isUser && "hidden",
          )}
        >
          {message.content}
        </Text>

        {!isUser ? (
          isPending && !message.content ? (
            <TypingIndicator />
          ) : (
            <div className={cn(isError ? "text-red-800" : "text-stone-900")}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <Text
                      size="base"
                      className={cn(
                        "mb-3 whitespace-pre-wrap break-words leading-normal last:mb-0",
                        isError ? "text-red-800" : "text-stone-900",
                      )}
                    >
                      {children}
                    </Text>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-3 list-disc pl-6 last:mb-0">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-3 list-decimal pl-6 last:mb-0">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="mb-1 leading-normal last:mb-0">{children}</li>
                  ),
                  h1: ({ children }) => (
                    <h3 className="mb-2 text-2xl leading-tight">{children}</h3>
                  ),
                  h2: ({ children }) => (
                    <h3 className="mb-2 text-xl leading-tight">{children}</h3>
                  ),
                  h3: ({ children }) => (
                    <h4 className="mb-2 text-lg leading-tight">{children}</h4>
                  ),
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-emerald-500 decoration-2 underline-offset-2"
                    >
                      {children}
                    </a>
                  ),
                  code: ({ className, children }) => {
                    const text = String(children).replace(/\n$/, "");
                    const isBlock =
                      className?.includes("language-") || text.includes("\n");

                    if (isBlock) {
                      return <CodeBlock code={text} className={className} />;
                    }

                    return (
                      <code className="rounded bg-[#eef5f1] px-1.5 py-0.5 font-mono text-[0.9em] text-emerald-800">
                        {text}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )
        ) : null}

        {!isUser ? (
          <div className="mt-3 flex items-center gap-3">
            <div className="relative h-6 w-6 overflow-hidden rounded-full border border-[#dce8df]">
              <Image
                src="/images/bucura-ai.png"
                alt="Bucura AI avatar"
                fill
                sizes="24px"
                className="object-cover"
              />
            </div>
            {onCopy && !hasFencedCodeBlock ? (
              <button
                type="button"
                onClick={() => onCopy(message)}
                className="text-stone-400 transition hover:text-emerald-600"
                aria-label="Copy message"
              >
                {isCopied ? (
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
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                )}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
