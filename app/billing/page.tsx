"use client";

import Link from "next/link";
import { Text } from "@/components/ui/Text";

export default function BillingPage() {
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
          <h1 className="text-4xl sm:text-5xl">Billing</h1>
          <Text size="base" className="mt-2 text-stone-700">
            Manage your subscription and billing details here. This section is currently under development.
          </Text>
        </section>
      </div>
    </main>
  );
}
