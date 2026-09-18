"use client";

import { useState } from "react";
import SignUpModal from "@/components/auth/SignUpModal";
import LoginModal from "@/components/auth/LoginModal";

export default function TestSignupPage() {
  const [isSignUpOpen, setIsSignUpOpen] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Bucura AI</h1>
          <p className="text-gray-400">Test Signup Flow</p>
        </div>

        {/* Info Box */}
        <div className="mb-8 rounded-lg border border-gray-700 bg-gray-900/50 p-6">
          <h2 className="text-white font-semibold mb-4">📋 Testing Instructions</h2>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>✓ Enter an email, username, and password</li>
            <li>✓ Create the account without email verification</li>
            <li>✓ Confirm you continue to the dashboard</li>
            <li>✓ Test with multiple accounts</li>
          </ul>
        </div>

        {/* Test Controls */}
        <div className="mb-8 space-y-2">
          <button
            onClick={() => {
              setIsSignUpOpen(true);
              setIsLoginOpen(false);
            }}
            className="w-full rounded-xl bg-white py-3 font-bold text-black hover:scale-[1.02] transition-transform"
          >
            Open SignUp
          </button>
          <button
            onClick={() => {
              setIsLoginOpen(true);
              setIsSignUpOpen(false);
            }}
            className="w-full rounded-xl border border-gray-700 py-3 font-bold text-white hover:border-white transition-colors"
          >
            Open Login
          </button>
        </div>

        {/* Feature Summary */}
        <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-6 space-y-4">
          <div>
            <h3 className="text-white font-semibold mb-2">🔒 Signup Behavior</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Email and password are collected directly</li>
              <li>• Account creation does not call the OTP APIs</li>
              <li>• Email OTP can be added later with a reliable provider</li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2">📧 Email Service</h3>
            <p className="text-xs text-gray-400">Email verification is deferred</p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2">🚀 Status</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <span className="text-xs text-gray-400">Direct signup operational</span>
            </div>
          </div>
        </div>

        {/* Test Credentials Box */}
        <div className="mt-8 rounded-lg border border-amber-700/30 bg-amber-900/20 p-4">
          <p className="text-xs text-amber-200">
            <span className="font-semibold">💡 Tip:</span> Use any email address and continue directly to account creation.
          </p>
        </div>
      </div>

      {/* Modals */}
      <SignUpModal
        isOpen={isSignUpOpen}
        onClose={() => setIsSignUpOpen(false)}
        onSwitchToLogin={() => {
          setIsSignUpOpen(false);
          setIsLoginOpen(true);
        }}
        redirectTo="/test-signup"
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToSignUp={() => {
          setIsLoginOpen(false);
          setIsSignUpOpen(true);
        }}
        redirectTo="/test-signup"
      />
    </div>
  );
}
