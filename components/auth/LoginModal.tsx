"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectTo?: string;
  onSwitchToSignUp: () => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  redirectTo = "/dashboard",
  onSwitchToSignUp,
}: LoginModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrorMessage(null);

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setFormData({ email: "", password: "" });
      onClose();
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to sign in.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="rounded-3xl border border-white/10 bg-[#1c1c1c] p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
          <p className="text-white">Log in to Bucura AI</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Input
              type="email"
              placeholder="Email address"
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-white font-bold focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-white font-bold focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          {errorMessage ? (
            <p className="text-sm text-red-400">{errorMessage}</p>
          ) : null}

          <Button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-xl bg-white py-3 font-bold text-black transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
          >
            {isLoading ? "Logging in..." : "Log In"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-white">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-blue-400 hover:underline"
          >
            Sign up
          </button>
        </div>
      </div>
    </Modal>
  );
}
