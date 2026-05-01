import { useState, useCallback, useRef } from 'react';
import type { EmailVerificationState } from '@/types/emailVerification';

export interface UseEmailVerificationOptions {
  onSuccess?: (email: string) => void;
  onError?: (error: string) => void;
}

export interface UseEmailVerification {
  email: string;
  setEmail: (email: string) => void;
  otp: string;
  setOTP: (otp: string) => void;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  otpSent: boolean;
  attemptsLeft: number;
  resendCountdown: number;
  verified: boolean;
  requestOTP: () => Promise<void>;
  verifyOTP: () => Promise<void>;
  resendOTP: () => Promise<void>;
  resetState: () => void;
}

export function useEmailVerification(
  options?: UseEmailVerificationOptions
): UseEmailVerification {
  const [email, setEmail] = useState('');
  const [otp, setOTP] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [resendCountdown, setResendCountdown] = useState(0);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  const startResendCountdown = useCallback((seconds: number = 60) => {
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }

    let remaining = seconds;
    setResendCountdown(remaining);

    countdownInterval.current = setInterval(() => {
      remaining -= 1;
      setResendCountdown(remaining);

      if (remaining <= 0 && countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    }, 1000);
  }, []);

  const requestOTP = useCallback(async () => {
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message ||
          'Failed to send OTP. Please try again.'
        );
        return;
      }

      setOtpSent(true);
      setSuccess('OTP sent to your email!');
      setOTP('');
      setAttemptsLeft(5);
      startResendCountdown(60);

      options?.onSuccess?.(email);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(`Failed to request OTP: ${message}`);
      options?.onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [email, startResendCountdown, options]);

  const verifyOTP = useCallback(async () => {
    setError(null);
    setSuccess(null);

    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError('OTP must be 6 digits');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          otp: otp.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || 'Invalid OTP');
        if (data.message?.includes('MAX_ATTEMPTS_EXCEEDED')) {
          setAttemptsLeft(0);
        }
        return;
      }

      if (data.verified) {
        setVerified(true);
        setSuccess('Email verified successfully!');
        setOTP('');
        setOtpSent(false);
        if (countdownInterval.current) {
          clearInterval(countdownInterval.current);
        }
        options?.onSuccess?.(email);
      } else {
        setError(data.message || 'Could not verify email');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(`Failed to verify OTP: ${message}`);
      options?.onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [email, otp, options]);

  const resendOTP = useCallback(async () => {
    if (resendCountdown > 0) {
      setError('Please wait before requesting another OTP');
      return;
    }

    await requestOTP();
  }, [resendCountdown, requestOTP]);

  const resetState = useCallback(() => {
    setEmail('');
    setOTP('');
    setError(null);
    setSuccess(null);
    setOtpSent(false);
    setVerified(false);
    setAttemptsLeft(5);
    setResendCountdown(0);
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
    }
  }, []);

  return {
    email,
    setEmail,
    otp,
    setOTP,
    isLoading,
    error,
    success,
    otpSent,
    attemptsLeft,
    resendCountdown,
    verified,
    requestOTP,
    verifyOTP,
    resendOTP,
    resetState,
  };
}
