"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ChatWindowProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export default function ChatWindow({
  children,
  className,
  contentClassName,
}: ChatWindowProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  });

  return (
    <section
      className={cn(
        "relative min-h-0 flex-1 overflow-y-auto rounded-xl",
        className,
      )}
    >
      <div className={cn("space-y-3", contentClassName)}>
        {children}
        <div ref={endRef} />
      </div>
    </section>
  );
}
