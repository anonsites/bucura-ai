"use client";

import { cn } from "@/lib/utils";

export type ToastVariant = "info" | "success" | "error";

export type ToastItem = {
  id: string;
  message: string;
  title?: string;
  variant?: ToastVariant;
};

type ToasterProps = {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
};

const VARIANT_STYLES: Record<ToastVariant, string> = {
  info: "border-[#c8dbcf] bg-white text-stone-900",
  success: "border-emerald-300 bg-emerald-50 text-emerald-900",
  error: "border-red-300 bg-red-50 text-red-900",
};

const VARIANT_ICON_STYLES: Record<ToastVariant, string> = {
  info: "bg-emerald-500",
  success: "bg-emerald-600",
  error: "bg-red-500",
};

export default function Toaster({ toasts, onDismiss }: ToasterProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((toast) => {
        const variant = toast.variant ?? "info";
        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto rounded-xl border px-3 py-3 shadow-lg backdrop-blur-sm",
              VARIANT_STYLES[variant],
            )}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-2">
              <span
                className={cn(
                  "mt-1 inline-block h-2.5 w-2.5 rounded-full",
                  VARIANT_ICON_STYLES[variant],
                )}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                {toast.title ? (
                  <p className="text-sm font-semibold leading-tight">{toast.title}</p>
                ) : null}
                <p className="text-sm leading-snug">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-stone-500 transition hover:bg-black/5 hover:text-stone-700"
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
