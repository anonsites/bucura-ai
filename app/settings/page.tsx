"use client";

import { useEffect, useState } from "react";
import { Text } from "@/components/ui/Text";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useHeader } from "@/components/layout/HeaderContext";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function SettingsPage() {
  const router = useRouter();
  const {
    fullName,
    setFullName,
    isDeveloper,
    setIsDeveloper,
    projectCount,
    isLoading,
    error: loadError,
  } = useUserProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const { setTitle } = useHeader();

  useEffect(() => {
    setTitle("Settings");
  }, [setTitle]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = fullName.trim();

    if (!trimmedName) {
      setFormError("Name cannot be empty.");
      return;
    }

    setIsSaving(true);
    setFormError(null);
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
      setFormError(err instanceof Error ? err.message : "Failed to update name.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDeveloper = async () => {
    if (isLoading || isSaving) return;

    // Safety check: Cannot disable if projects exist
    if (isDeveloper && projectCount > 0) {
      setFormError("Cannot disable Developer Mode while you have active projects. Please delete them first.");
      return;
    }

    setIsSaving(true);
    setFormError(null);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No user found.");

      const newRole = isDeveloper ? "student" : "developer";

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setIsDeveloper(!isDeveloper);
      setMessage(isDeveloper ? "Developer Mode disabled." : "Developer Mode enabled. Refreshing...");
      router.refresh(); // Refresh to update sidebar/layout
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className="card border-[#dce8df] bg-white">
        <Text size="base" className="mt-2 text-stone-700">
          Update your username.
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

          {formError || loadError ? (
            <Text size="sm" className="text-red-600">
              {formError || loadError}
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

      {/* Developer Mode Toggle Section */}
      <section className="card border-[#dce8df] bg-white">
        <div className="flex items-center justify-between">
          <div>
            <Text size="lg" className="font-bold text-stone-900">
              Developer Mode
            </Text>
            <Text size="sm" className="mt-1 text-stone-600">
              Enable access to create and manage chatbots for your websites.
            </Text>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isDeveloper}
            onClick={handleToggleDeveloper}
            disabled={isLoading || isSaving}
            className={`${
              isDeveloper ? "bg-emerald-500" : "bg-stone-300"
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <span
              aria-hidden="true"
              className={`${
                isDeveloper ? "translate-x-5" : "translate-x-0"
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>
        {isDeveloper && projectCount > 0 && (
          <div className="mt-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 border border-yellow-200">
            <strong>Note:</strong> You have {projectCount} active project(s). You must delete them before disabling Developer Mode.
          </div>
        )}
      </section>
    </div>
  );
}
