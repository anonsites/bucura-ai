"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
  onSwitchToLogin: () => void;
}

export default function SignUpModal({
  isOpen,
  onClose,
  redirectTo = "/dashboard",
  onSwitchToLogin,
}: SignUpModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    const fullName = formData.fullName.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!fullName || !email || !password) {
      setErrorMessage("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.session) {
        setFormData({ fullName: "", email: "", password: "" });
        onClose();
        router.push(redirectTo);
        router.refresh();
        return;
      }

      setSuccessMessage(
        "Account created. You can now log in and continue to your dashboard.",
      );
      setFormData((current) => ({ ...current, password: "" }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create account.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="rounded-3xl border border-white/10 bg-[#1c1c1c] p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-white">Create Account</h2>
          <p className="text-white">Try Bucura AI today</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Input
              placeholder="Username:"
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-white font-bold focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>
          <div>
            <Input
              type="email"
              placeholder="Email:"
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-white font-bold focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password:"
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-white font-bold focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
          </div>

          {errorMessage ? (
            <p className="text-sm text-red-400">{errorMessage}</p>
          ) : null}
          {successMessage ? (
            <p className="text-sm text-emerald-400">{successMessage}</p>
          ) : null}

          <Button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-xl bg-white py-3 font-bold text-black transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
          >
            {isLoading ? "Creating..." : "Sign Up"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-white">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-blue-400 hover:underline"
          >
            Log in
          </button>
        </div>
      </div>
    </Modal>
  );
}
