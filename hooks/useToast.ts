"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ToastItem, ToastVariant } from "@/components/ui/Toaster";

type PushToastInput = {
  message: string;
  title?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

const DEFAULT_DURATION_MS = 2800;

function createToastId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismissToast = useCallback((id: string) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ message, title, variant = "info", durationMs = DEFAULT_DURATION_MS }: PushToastInput) => {
      const id = createToastId();

      setToasts((current) => [...current, { id, message, title, variant }]);

      timersRef.current[id] = setTimeout(() => {
        dismissToast(id);
      }, durationMs);

      return id;
    },
    [dismissToast],
  );

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((timerId) => {
        clearTimeout(timerId);
      });
      timersRef.current = {};
    };
  }, []);

  return {
    toasts,
    pushToast,
    dismissToast,
  };
}
