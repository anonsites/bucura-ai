import Link from "next/link";
import { Text } from "@/components/ui/Text";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f7f7fb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-[#d8e5dc] bg-white px-3 py-1 text-xs font-semibold tracking-wide uppercase text-stone-700 transition hover:border-emerald-300 hover:text-emerald-700"
        >
          Back Home
        </Link>

        <section className="card border-[#dce8df] bg-white">
          <h1 className="text-4xl sm:text-5xl">Terms Of Service</h1>
          <Text size="base" className="mt-3 text-stone-700">
            Bucura AI is provided as an evolving service. Features may change or be
            limited while development continues.
          </Text>
          <Text size="base" className="mt-2 text-stone-700">
            You are responsible for how you use generated content. Do not use the
            service for unlawful, abusive, or harmful activities.
          </Text>
          <Text size="base" className="mt-2 text-stone-700">
            We may update these terms as the project grows. Continued use means you
            accept the latest version.
          </Text>
        </section>
      </div>
    </main>
  );
}
