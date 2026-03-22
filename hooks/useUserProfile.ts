import { useState, useCallback, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { User } from "@supabase/supabase-js";

export function useUserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [projectCount, setProjectCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setIsLoading(false);
        return;
      }

      setUser(user);
      const initialName =
        (user.user_metadata?.full_name as string | undefined) ?? "";
      setFullName(initialName);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile) {
        setIsDeveloper(profile.role === "developer");

        const { count } = await supabase
          .from("websites")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", user.id);
        setProjectCount(count || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  return {
    user,
    fullName,
    setFullName,
    isDeveloper,
    setIsDeveloper,
    projectCount,
    isLoading,
    error,
    refreshProfile: loadUser,
  };
}