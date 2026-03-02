"use client";

import { useRef, useState } from "react";
import ModeSelector from "@/components/chat/ModeSelector";
import type { ChatMode } from "@/types/conversation";

type ChatInputProps = {
  onSubmit: (payload: { content: string; mode: ChatMode }) => Promise<boolean> | boolean;
  disabled?: boolean;
  mode?: ChatMode;
  onModeChange?: (mode: ChatMode) => void;
  initialMode?: ChatMode;
  placeholder?: string;
  showModeSelector?: boolean;
  showExtensionButton?: boolean;
  onExtensionClick?: () => void;
};

export default function ChatInput({
  onSubmit,
  disabled = false,
  mode,
  onModeChange,
  initialMode = "explanation",
  placeholder = "Ask bucura anything...",
  showModeSelector = true,
  showExtensionButton = true,
  onExtensionClick,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [internalMode, setInternalMode] = useState<ChatMode>(initialMode);

  const activeMode = mode ?? internalMode;
  const setActiveMode = onModeChange ?? setInternalMode;

  const resizeTextarea = (target: HTMLTextAreaElement) => {
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 220)}px`;
  };

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = value.trim();
        if (!trimmed || disabled || isSubmitting) {
          return;
        }

        setIsSubmitting(true);

        Promise.resolve(onSubmit({ content: trimmed, mode: activeMode }))
          .then((didSucceed) => {
            if (didSucceed) {
              setValue("");
              if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
              }
            }
          })
          .finally(() => {
            setIsSubmitting(false);
          });
      }}
    >
      <div className="flex items-end gap-2 rounded-2xl border border-[#cfddd3] bg-white p-2 shadow-[0_4px_14px_rgba(10,32,18,0.06)]">
        <div className="flex shrink-0 items-center gap-1">
          {showExtensionButton ? (
            <button
              type="button"
              onClick={onExtensionClick}
              disabled={disabled || isSubmitting}
              aria-label="Attachment button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-stone-600 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>
            </button>
          ) : null}
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          rows={1}
          disabled={disabled || isSubmitting}
          placeholder={placeholder}
          onChange={(event) => {
            setValue(event.target.value);
            resizeTextarea(event.currentTarget);
          }}
          onInput={(event) =>
            resizeTextarea(event.currentTarget as HTMLTextAreaElement)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          className="max-h-[220px] w-full flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-stone-900 outline-none disabled:cursor-not-allowed"
        />

        <button
          type="submit"
          disabled={disabled || isSubmitting || !value.trim()}
          aria-label="Send message"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-600/50"
        >
          {isSubmitting ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5 animate-spin"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v4M12 16v4M4 12h4M16 12h4" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
              />
            </svg>
          )}
        </button>
      </div>

      {showModeSelector ? (
        <div className="flex items-center justify-center gap-2 sm:justify-start">
          <ModeSelector
            value={activeMode}
            onChange={setActiveMode}
            disabled={disabled || isSubmitting}
          />
        </div>
      ) : null}
    </form>
  );
}
