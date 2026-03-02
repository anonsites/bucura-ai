"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Text } from "@/components/ui/Text";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function SettingsPage() {
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
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

        if (!cancelled) {
          const initialName =
            (user?.user_metadata?.full_name as string | undefined) ?? "";
          setFullName(initialName);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load profile.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = fullName.trim();

    if (!trimmedName) {
      setError("Name cannot be empty.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error(userError?.message || "User session not found.");
      }

      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { full_name: trimmedName },
      });

      if (authUpdateError) {
        throw authUpdateError;
      }

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: trimmedName,
          },
          { onConflict: "id" },
        );

      if (profileUpdateError) {
        throw profileUpdateError;
      }

      setMessage("Your name has been updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update name.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f7fb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full border border-[#d8e5dc] bg-white px-3 py-1 text-xs font-semibold tracking-wide uppercase text-stone-700 transition hover:border-emerald-300 hover:text-emerald-700"
        >
          Back To Dashboard
        </Link>

        <section className="card border-[#dce8df] bg-white">
          <h1 className="text-4xl sm:text-5xl">Settings</h1>
          <Text size="base" className="mt-2 text-stone-700">
            Update your display name used across Bucura AI.
          </Text>

          <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-stone-700" htmlFor="fullName">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              disabled={isLoading || isSaving}
              placeholder="Your name"
              className="w-full rounded-xl border border-[#d8e5dc] bg-white px-3 py-2 text-stone-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-[#f5f8f6]"
            />

            {error ? (
              <Text size="sm" className="text-red-600">
                {error}
              </Text>
            ) : null}

            {message ? (
              <Text size="sm" className="text-emerald-700">
                {message}
              </Text>
            ) : null}

            <button
              type="submit"
              disabled={isLoading || isSaving}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
