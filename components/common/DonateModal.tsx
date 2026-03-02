"use client";

import Modal from "@/components/ui/Modal";
import { Text } from "@/components/ui/Text";

type DonateModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const DONATION_USSD = "*182*8*1*387483*";

export default function DonateModal({ isOpen, onClose }: DonateModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="rounded-2xl border border-[#dce8df] bg-white p-5 shadow-xl">
        <h3 className="text-2xl text-stone-900">Donate To Bucura AI</h3>
        <Text size="base" className="mt-2 text-stone-700">
          Support Bucura AI development by dialing the donation code below.
        </Text>

        <div className="mt-3 rounded-xl border border-[#dce8df] bg-[#f7fbf9] px-3 py-2">
          <p className="text-sm font-semibold text-stone-900">{DONATION_USSD}</p>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#d8e5dc] bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-emerald-300 hover:text-emerald-700"
          >
            Cancel
          </button>
          <a
            href={`tel:${DONATION_USSD}`}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Dial Now
          </a>
        </div>
      </div>
    </Modal>
  );
}
