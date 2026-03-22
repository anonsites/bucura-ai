"use client";

import ApiExampleCard from "../ui/ApiExampleCard";

type DevelopersSectionProps = {
  onSignUpClick?: () => void;
};

export default function DevelopersSection({ onSignUpClick }: DevelopersSectionProps) {
  return (
    <section className="hidden w-full border-t border-[#e5ece7] bg-[#f4fbf7] py-24 lg:block">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-16 lg:flex-row">
          <div className="w-full space-y-8 lg:w-1/2">
            <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-4 py-1.5 text-sm font-bold tracking-wide text-emerald-800 uppercase">
              For Developers
            </div>
            <h2 className="text-4xl font-bold leading-tight text-stone-900 lg:text-5xl">
              Bucuara customer support chatbot
            </h2>
            <p className="text-lg leading-relaxed text-stone-600">
              Integrate bucura in your projects and skip customer confusion
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-200 text-emerald-800">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">24/7 support</h3>
                  <p className="text-stone-600">Respond to your customer inquiries with confident responses.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-200 text-emerald-800">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </div>
                <div>
                  <h3 className="font-bold text-stone-900">Simple Integration</h3>
                  <p className="text-stone-600">Embed a widget or use our REST API to connect your tailored bot instantly.</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={onSignUpClick}
                className="rounded-full bg-stone-900 px-8 py-4 font-bold text-white shadow-lg transition hover:bg-stone-800 hover:shadow-xl"
              >
                Get API Access
              </button>
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <ApiExampleCard />
          </div>
        </div>
      </div>
    </section>
  );
}
