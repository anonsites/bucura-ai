"use client";

import Link from "next/link";
import { Text } from "@/components/ui/Text";
import type { Website } from "@/types/website";

type ProjectListProps = {
  projects: Website[];
  isLoading: boolean;
  error: string | null;
};

export default function ProjectList({ projects, isLoading, error }: ProjectListProps) {
  if (isLoading) {
    return <div className="card border-[#dce8df] bg-white p-6 text-center text-stone-500">Loading projects...</div>;
  }

  if (error) {
    return <div className="card border-red-200 bg-red-50 p-6 text-center text-red-700">Error: {error}</div>;
  }

  if (projects.length === 0) {
    return <div className="card border-[#dce8df] bg-white p-6 text-center text-stone-600">You haven&apos;t created any projects yet.</div>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link href={`/developers/project/${project.id}`} key={project.id} className="card block border-[#dce8df] bg-white p-6 transition hover:border-emerald-400 hover:shadow-md">
          <h3 className="font-bold text-stone-900 text-lg truncate">{project.name}</h3>
          {project.domain && (
            <Text size="sm" className="text-stone-500 mt-1 truncate">{project.domain}</Text>
          )}
          <Text size="sm" className="text-stone-400 mt-4 text-xs">
            Created: {new Date(project.created_at).toLocaleDateString()}
          </Text>
        </Link>
      ))}
    </div>
  );
}