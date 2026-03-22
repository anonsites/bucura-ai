"use client";

import { useEffect, useState } from "react";
import { Text } from "@/components/ui/Text";
import { useHeader } from "@/components/layout/HeaderContext";

const WHATSAPP_NUMBER = "250790454357";

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState("");
  const { setTitle } = useHeader();

  useEffect(() => {
    setTitle("Feedback");
  }, [setTitle]);

  const openWhatsApp = () => {
    const trimmed = feedback.trim();
    if (!trimmed) {
      return;
    }

    const message = encodeURIComponent(`BUCURA AI FEEDBACK:\n${trimmed}`);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
        <section className="card border-[#dce8df] bg-white">
          <Text size="base" className="mt-2 text-stone-700">
            Tell us what works, what breaks, and what you want next. Your feedback is very important to us.
          </Text>

          <div className="mt-5 space-y-3">
            <textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              rows={6}
              placeholder="Write your feedback..."
              className="w-full rounded-xl border border-[#d8e5dc] bg-white px-3 py-2 text-stone-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={openWhatsApp}
                disabled={!feedback.trim()}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send Via WhatsApp
              </button>
            </div>
          </div>
        </section>
    </div>
  );
}
