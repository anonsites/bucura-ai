"use client";

import type { ChatMode } from "@/types/conversation";
import { CHAT_MODES } from "@/types/conversation";
import { cn } from "@/lib/utils";

type ModeSelectorProps = {
  value: ChatMode;
  onChange: (value: ChatMode) => void;
  disabled?: boolean;
};

const MODE_LABELS: Record<ChatMode, string> = {
  exam: "Quiz",
  explanation: "Explanation",
  summary: "Summary",
};

export default function ModeSelector({
  value,
  onChange,
  disabled = false,
}: ModeSelectorProps) {
  return (
    <div className="inline-flex rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px]">
      <div className="inline-flex rounded-full bg-white p-0.5">
        {CHAT_MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            disabled={disabled}
            onClick={() => onChange(mode)}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase transition-all",
              value === mode
                ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-sm"
                : "text-stone-600 hover:bg-stone-100",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            {MODE_LABELS[mode]}
          </button>
        ))}
      </div>
    </div>
  );
}
