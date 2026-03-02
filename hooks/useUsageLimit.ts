"use client";

import { useMemo, useState } from "react";

export function useUsageLimit(limit = 100) {
  const [used, setUsed] = useState(0);
  const remaining = useMemo(() => Math.max(limit - used, 0), [limit, used]);

  return {
    used,
    remaining,
    increment: () => setUsed((value) => value + 1),
  };
}
