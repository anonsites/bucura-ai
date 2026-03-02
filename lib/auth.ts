import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase";

export function isAuthenticated(userId: string | null | undefined): boolean {
  return Boolean(userId);
}

export async function getAuthenticatedUser(
  supabaseClient?: SupabaseClient,
): Promise<{ supabase: SupabaseClient; user: User | null }> {
  const supabase = supabaseClient ?? (await createSupabaseServerClient());
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { supabase, user: null };
  }

  return { supabase, user: data.user };
}
