"use client";

import Link from "next/link";
import Image from "next/image";
import { Text } from "@/components/ui/Text";
import Footer from "@/components/layout/Footer";
import ApiExampleCard from "@/components/ui/ApiExampleCard";

export default function DocumentationPage() {
  return (
    <main className="min-h-screen bg-[#f7f7fb] flex flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-stone-300 bg-[#8a8ba8]">
              <Image
                src="/images/bucura-ai.png"
                alt="Bucura AI Logo"
                fill
                className="object-cover"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-stone-900">
              AI CHATBOT
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-stone-600 hover:text-stone-900"
            >
              Home
            </Link>
            <Link
              href="/developers"
              className="rounded-full bg-stone-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-stone-800"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-16">
          <div className="mb-12">
            <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-bold tracking-wide text-emerald-800 uppercase mb-4">
              Developer Docs
            </div>
            <h1 className="text-4xl font-extrabold text-stone-900 sm:text-5xl mb-6">
              Documentation
            </h1>
            <Text size="lg" className="text-stone-600 max-w-2xl">
              Integrate Bucura AI&apos;s customer support chatbot into your
              applications. Configure custom AI assistants for every website you
              manage.
            </Text>
          </div>

          <hr className="border-stone-200 mb-12" />

          {/* 1. Architecture */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-stone-900 mb-4">
              1. How It Works
            </h2>
            <Text className="mb-6">
              Bucura AI acts as a <strong>24/7 intelligent support agent</strong>{" "}
              for your business. Instead of static FAQs, it uses advanced AI to{" "}
              <strong>understand your website&apos;s content</strong> and answer
              customer questions naturally, instantly reducing your support
              team&apos;s workload.
            </Text>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-[#dce8df] bg-white p-6 shadow-sm">
                <h3 className="font-bold text-stone-900 mb-2">
                  Dedicated Assistants
                </h3>
                <p className="text-sm text-stone-600">
                  Every website you add gets its own isolated AI brain. It knows
                  your specific products and services, not someone else&apos;s.
                </p>
              </div>
              <div className="rounded-xl border border-[#dce8df] bg-white p-6 shadow-sm">
                <h3 className="font-bold text-stone-900 mb-2">
                  Brand Control
                </h3>
                <p className="text-sm text-stone-600">
                  You define how it speaks. Customize the system prompt to
                  ensure the AI uses your brand&apos;s tone, whether professional
                  or casual.
                </p>
              </div>
              <div className="rounded-xl border border-[#dce8df] bg-white p-6 shadow-sm">
                <h3 className="font-bold text-stone-900 mb-2">
                  Secure Insights
                </h3>
                <p className="text-sm text-stone-600">
                  Chat history is securely stored. Review conversations to gain
                  insights into what your customers are really looking for and
                  where they get stuck.
                </p>
              </div>
              <div className="rounded-xl border border-[#dce8df] bg-white p-6 shadow-sm">
                <h3 className="font-bold text-stone-900 mb-2">
                  Smart Knowledge
                </h3>
                <p className="text-sm text-stone-600">
                  (Coming Soon) Upload PDFs, manuals, or existing FAQs. The bot
                  will reference these specific documents to give precise,
                  fact-checked answers.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Setup Guide */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-stone-900 mb-6">
              2. Setup Guide
            </h2>

            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="flex-none flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-white font-bold text-sm">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    Create developer account
                  </h3>
                  <Text className="mt-1">
                    Sign up or sign in to your account
                    Naviagate to settings and turn on developer mode
                    Naviagate to Developer space from Side bar navigator and follow instructions to create your first project.
                  </Text>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-none flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-white font-bold text-sm">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    Add your website and Configure chatbot Behavior
                  </h3>
                  <Text className="mt-1">
                    Go to settings for your new website. Set the{" "}
                    <strong>System Prompt</strong> to define the bot&apos;s
                    persona (e.g., &quot;You are a helpful support agent for
                    [Company name]&quot;).
                  </Text>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-none flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 text-white font-bold text-sm">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">
                    Get API Key and embend the widget
                  </h3>
                  <Text className="mt-1">
                    Generate a secure API key. We handle the frontend and backend structure, just copy and embed the scripts 
                  </Text>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Integration */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-stone-900 mb-6">
              3. Integration
            </h2>

            <div className="space-y-8">
              {/* Widget */}
              <div>
                <h3 className="text-xl font-bold text-stone-800 mb-3">
                  Option A: Embed Widget
                </h3>
                <Text className="mb-4">
                  The fastest way to get started. Just copy this snippet into
                  your website&apos;s <code>&lt;head&gt;</code> or{" "}
                  <code>&lt;body&gt;</code>.
                </Text>
                <div className="rounded-xl border border-stone-800 bg-[#1e1e1e] p-4 shadow-lg overflow-x-auto">
                  <code className="text-sm font-mono text-gray-300">
                    &lt;script <br />
                    &nbsp;&nbsp;src=&quot;https://bucura.ai/widget.js&quot;{" "}
                    <br />
                    &nbsp;&nbsp;data-key=&quot;
                    <span className="text-emerald-400">YOUR_API_KEY</span>
                    &quot;
                    <br />
                    &gt;&lt;/script&gt;
                  </code>
                </div>
              </div>

              {/* API */}
              <div>
                <h3 className="text-xl font-bold text-stone-800 mb-3">
                  Option B: REST API
                </h3>
                <Text className="mb-4">
                  For complete control over the UI, communicate directly with
                  our chat endpoint.
                </Text>

                <ApiExampleCard />
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}