"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useHeader } from "@/components/layout/HeaderContext";
import { Text } from "@/components/ui/Text";
import Link from "next/link";
import type { Website } from "@/types/website";

type ProjectDetail = Website & {
  api_keys: { key: string }[];
  chatbot_configs: {
    system_prompt: string;
    model: string;
    temperature: number;
  } | null;
};

export default function ProjectDetailPage() {
  const params = useParams();
  const { setTitle } = useHeader();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const projectId = typeof params.id === 'string' ? params.id : '';

  useEffect(() => {
    setTitle("Project Details");
  }, [setTitle]);

  useEffect(() => {
    if (!projectId) return;

    const fetchProjectDetails = async () => {
      setIsLoading(true);
      setError(null);
      const supabase = createSupabaseBrowserClient();
      
      const { data, error } = await supabase
        .from("websites")
        .select(`
          *,
          api_keys (key),
          chatbot_configs (system_prompt, model, temperature)
        `)
        .eq("id", projectId)
        .single();

      if (error) {
        setError(error.message);
      } else {
        setProject(data as unknown as ProjectDetail);
      }
      setIsLoading(false);
    };

    void fetchProjectDetails();
  }, [projectId]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-stone-500">Loading project...</div>;
  }

  if (error || !project) {
    return (
      <div className="p-8 text-center">
        <Text className="text-red-600 mb-4">{error || "Project not found"}</Text>
        <Link href="/developers" className="text-emerald-600 hover:underline">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  const apiKey = project.api_keys?.[0]?.key || "No API Key found";
  const config = project.chatbot_configs || { system_prompt: "Default", model: "Default", temperature: 0.5 };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/developers" className="text-stone-400 hover:text-stone-600 transition">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-stone-900">{project.name}</h1>
          </div>
          <Text className="text-stone-500">{project.domain || "No domain configured"}</Text>
        </div>
        <button className="inline-flex items-center justify-center rounded-xl border border-[#d8e5dc] bg-white px-4 py-2 text-sm font-bold text-stone-700 transition hover:border-emerald-300 hover:text-emerald-700">Settings</button>
      </div>

      <hr className="border-stone-200" />

      {/* Integration */}
      <section className="card bg-white border-[#dce8df] p-6">
        <h2 className="text-xl font-bold text-stone-900 mb-4">Integration</h2>
        <Text className="mb-4">Copy this snippet and paste it into the <code>&lt;body&gt;</code> of your website.</Text>
        
        <div className="relative group">
          <div className="bg-[#1e1e1e] rounded-xl p-4 overflow-x-auto border border-stone-800 font-mono text-sm text-gray-300">
            &lt;script <br/>
            src=&nbsp;https://bucura.ai/widget.js&nbsp; <br/>
            data-key=&nbsp;<span className="text-emerald-400">{apiKey}</span>&nbsp;<br/>
            &gt;&lt;/script&gt;
          </div>
          <button 
            onClick={() => copyToClipboard(`<script src="https://bucura.ai/widget.js" data-key="${apiKey}"></script>`)}
            className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md transition opacity-0 group-hover:opacity-100"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        {/* API Key */}
        <section className="card bg-white border-[#dce8df] p-6">
          <h2 className="text-lg font-bold text-stone-900 mb-2">API Key</h2>
          <div className="flex items-center gap-2 bg-stone-50 p-3 rounded-lg border border-stone-200">
            <code className="text-sm text-stone-600 truncate flex-1">{apiKey}</code>
            <button 
              onClick={() => copyToClipboard(apiKey)}
              className="text-stone-400 hover:text-stone-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
                <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
              </svg>
            </button>
          </div>
        </section>

        {/* Config Summary */}
        <section className="card bg-white border-[#dce8df] p-6">
          <h2 className="text-lg font-bold text-stone-900 mb-2">Configuration</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-500">Model</span>
              <span className="font-medium text-stone-900">{config?.model || 'Default'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Temperature</span>
              <span className="font-medium text-stone-900">{config?.temperature ?? 0.5}</span>
            </div>
            <div className="pt-2">
              <span className="text-stone-500 block mb-1">System Prompt</span>
              <div className="bg-stone-50 p-2 rounded border border-stone-200 text-stone-700 text-xs line-clamp-3">
                {config?.system_prompt || 'Default system prompt...'}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}