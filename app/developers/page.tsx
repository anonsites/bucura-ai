"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useHeader } from "@/components/layout/HeaderContext";
import { Text } from "@/components/ui/Text";
import AddProjectForm from "@/components/developers/AddProjectForm";
import ProjectList from "@/components/developers/ProjectList";
import type { Website } from "@/types/website";

export default function DevelopersDashboardPage() {
  const { setTitle } = useHeader();
  const [projects, setProjects] = useState<Website[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    setTitle("Developer Dashboard");
  }, [setTitle]);

  const handleProjectAdded = () => {
    setRefreshTrigger((count) => count + 1);
  };

  useEffect(() => {
    let ignore = false;

    async function fetchProjects() {
      setIsLoading(true);
      setError(null);
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error: projectsError } = await supabase
          .from("websites")
          .select("*")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });

        if (!ignore) {
          if (projectsError) {
            setError(projectsError.message);
          } else {
            setProjects(data || []);
          }
        }
      }
      if (!ignore) {
        setIsLoading(false);
      }
    }

    void fetchProjects();

    return () => {
      ignore = true;
    };
  }, [refreshTrigger]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold text-stone-900 mb-4">Add New Project</h2>
        <AddProjectForm onProjectAdded={handleProjectAdded} />
      </section>

      <hr className="border-stone-200" />

      <ProjectList projects={projects} isLoading={isLoading} error={error} />
    </div>
  );
}