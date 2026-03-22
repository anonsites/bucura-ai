"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Text } from "@/components/ui/Text";

type AddProjectFormProps = {
  onProjectAdded: () => void;
};

export default function AddProjectForm({ onProjectAdded }: AddProjectFormProps) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Project name is required.");
      return;
    }

    setIsSaving(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Please note that this page is under development! You must be logged in to create a project.");
      setIsSaving(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("websites")
      .insert({ name: name.trim(), domain: domain.trim() || null, owner_id: user.id });

    if (insertError) {
      setError(insertError.message);
    } else {
      setName("");
      setDomain("");
      onProjectAdded();
    }
    setIsSaving(false);
  };

  return (
    <form className="card border-[#dce8df] bg-white max-w-2xl p-6 space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="projectName">Project Name</label>
        <input id="projectName" type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={isSaving} placeholder="My Awesome Project" className="mt-1 w-full rounded-xl border border-[#d8e5dc] bg-white px-3 py-2 text-stone-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-[#f5f8f6]" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="projectDomain">Domain (Optional)</label>
        <input id="projectDomain" type="text" value={domain} onChange={(e) => setDomain(e.target.value)} disabled={isSaving} placeholder="example.com" className="mt-1 w-full rounded-xl border border-[#d8e5dc] bg-white px-3 py-2 text-stone-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-[#f5f8f6]" />
      </div>

      {error && <Text size="sm" className="text-red-600">{error}</Text>}

      <div className="flex justify-end">
        <button type="submit" disabled={isSaving} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60">
          {isSaving ? "Creating..." : "Create Project"}
        </button>
      </div>
    </form>
  );
}