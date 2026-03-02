import Link from "next/link";
import { Text } from "@/components/ui/Text";

export default function PrivacyPage() {
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
          <h1 className="text-4xl sm:text-5xl">Privacy Policy</h1>
          <Text size="base" className="mt-3 text-stone-700">
            We collect only the data needed to run Bucura AI, such as account
            information, chat content, and usage metrics.
          </Text>
          <Text size="base" className="mt-2 text-stone-700">
            Your data is used to provide responses, improve reliability, and enforce
            usage limits. We do not sell your personal data.
          </Text>
          <Text size="base" className="mt-2 text-stone-700">
            By using Bucura AI, you consent to this data handling while the project is
            under active development.
          </Text>
        </section>
      </div>
    </main>
  );
}
