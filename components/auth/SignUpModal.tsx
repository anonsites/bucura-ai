"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useEmailVerification } from "@/hooks/useEmailVerification";

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
  const [signUpStep, setSignUpStep] = useState<"email-verification" | "account-details">("email-verification");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  // Email verification hook
  const {
    email: emailVerificationEmail,
    setEmail: setEmailVerificationEmail,
    otp,
    setOTP,
    otpSent,
    verified,
    isLoading: emailLoading,
    error: emailError,
    success: emailSuccess,
    attemptsLeft,
    resendCountdown,
    requestOTP,
    verifyOTP,
    resendOTP,
    resetState: resetEmailVerification,
  } = useEmailVerification({
    onSuccess: (verifiedEmail) => {
      // Move to account details step after successful email verification
      setFormData((prev) => ({ ...prev, email: verifiedEmail }));
      setSignUpStep("account-details");
    },
  });

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setSignUpStep("email-verification");
      resetEmailVerification();
    }
  }, [isOpen, resetEmailVerification]);

  const handleEmailVerificationStep = async () => {
    if (!otpSent) {
      // Request OTP
      setEmailVerificationEmail(emailVerificationEmail);
      await requestOTP();
    }
  };

  const handleVerifyOTP = async () => {
    await verifyOTP();
  };

  const handleAccountDetailsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrorMessage(null);
    setSuccessMessage(null);

    const fullName = formData.fullName.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!fullName || !password) {
      setErrorMessage("Username and password are required.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (!verified) {
      setErrorMessage("Email verification required.");
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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.session) {
        setFormData({ fullName: "", email: "", password: "" });
        resetEmailVerification();
        onClose();
        router.push(redirectTo);
        router.refresh();
        return;
      }

      setSuccessMessage(
        "Account created successfully! You can now log in to your dashboard.",
      );
      setFormData((current) => ({ ...current, password: "" }));
      setTimeout(() => {
        resetEmailVerification();
        setSignUpStep("email-verification");
        onClose();
      }, 2000);
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

        {/* STEP 1: EMAIL VERIFICATION */}
        {signUpStep === "email-verification" && (
          <div className="flex flex-col gap-4">
            {!otpSent ? (
              // Email request phase
              <>
                <div>
                  <Input
                    type="email"
                    placeholder="Email:"
                    className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-white font-bold focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
                    value={emailVerificationEmail}
                    onChange={(e) => setEmailVerificationEmail(e.target.value)}
                    disabled={emailLoading}
                    required
                  />
                </div>

                {emailError && <p className="text-sm text-red-400">{emailError}</p>}
                {emailSuccess && <p className="text-sm text-emerald-400">{emailSuccess}</p>}

                <Button
                  type="button"
                  onClick={handleEmailVerificationStep}
                  disabled={emailLoading || !emailVerificationEmail}
                  className="mt-2 w-full rounded-xl bg-white py-3 font-bold text-black transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                >
                  {emailLoading ? "Sending OTP..." : "Send Verification Code"}
                </Button>
              </>
            ) : !verified ? (
              // OTP verification phase
              <>
                <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4 mb-4">
                  <p className="text-sm text-gray-300">
                    Verification code sent to <span className="font-semibold text-white">{emailVerificationEmail}</span>
                  </p>
                </div>

                <div>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code:"
                    className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-white font-bold focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50 text-center tracking-widest"
                    value={otp}
                    onChange={(e) => setOTP(e.target.value.slice(0, 6))}
                    maxLength="6"
                    inputMode="numeric"
                    disabled={emailLoading}
                    required
                  />
                </div>

                <div className="text-xs text-gray-400">
                  Attempts remaining: <span className="text-white font-semibold">{attemptsLeft}</span>
                </div>

                {emailError && <p className="text-sm text-red-400">{emailError}</p>}
                {emailSuccess && <p className="text-sm text-emerald-400">{emailSuccess}</p>}

                <Button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={emailLoading || otp.length !== 6}
                  className="mt-2 w-full rounded-xl bg-white py-3 font-bold text-black transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                >
                  {emailLoading ? "Verifying..." : "Verify Code"}
                </Button>

                <div className="text-center">
                  {resendCountdown > 0 ? (
                    <p className="text-xs text-gray-400">
                      Resend code in <span className="font-semibold">{resendCountdown}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={resendOTP}
                      disabled={emailLoading}
                      className="text-xs text-blue-400 hover:underline disabled:opacity-50"
                    >
                      Didn't receive code? Resend
                    </button>
                  )}
                </div>
              </>
            ) : null}

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
        )}

        {/* STEP 2: ACCOUNT DETAILS */}
        {signUpStep === "account-details" && (
          <form onSubmit={handleAccountDetailsSubmit} className="flex flex-col gap-4">
            <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4 mb-4">
              <p className="text-sm text-gray-300">
                Email verified: <span className="font-semibold text-emerald-400">✓ {formData.email}</span>
              </p>
            </div>

            <div>
              <Input
                placeholder="Username:"
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-white font-bold focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder="Password (min 6 characters):"
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder-white font-bold focus:border-white/50 focus:outline-none focus:ring-1 focus:ring-white/50"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
                required
                minLength={6}
              />
            </div>

            {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
            {successMessage && <p className="text-sm text-emerald-400">{successMessage}</p>}

            <Button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full rounded-xl bg-white py-3 font-bold text-black transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>

            <button
              type="button"
              onClick={() => {
                resetEmailVerification();
                setSignUpStep("email-verification");
              }}
              disabled={isLoading}
              className="text-sm text-gray-400 hover:text-white disabled:opacity-50"
            >
              ← Use different email
            </button>

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
          </form>
        )}
      </div>
    </Modal>
  );
}
