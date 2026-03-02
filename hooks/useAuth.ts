"use client";

import { useMemo, useState } from "react";

export function useAuth() {
  const [userId, setUserId] = useState<string | null>(null);
  const isAuthenticated = useMemo(() => Boolean(userId), [userId]);

  return {
    userId,
    isAuthenticated,
    login: (id: string) => setUserId(id),
    logout: () => setUserId(null),
  };
}
