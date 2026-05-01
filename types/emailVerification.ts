export interface EmailVerificationRequest {
  email: string;
}

export interface OTPVerificationRequest {
  email: string;
  otp: string;
}

export interface EmailVerificationResponse {
  success: boolean;
  message: string;
  data?: {
    id?: string;
    expiresAt?: string;
    resendCountdown?: number;
  };
}

export interface OTPVerificationResponse {
  success: boolean;
  verified: boolean;
  message: string;
  data?: {
    verifiedAt?: string;
  };
}

export interface EmailVerificationState {
  email: string;
  otpSent: boolean;
  expiresAt: Date | null;
  attemptsLeft: number;
  resendCountdown: number;
  message: string;
}

export interface SendOTPEmailPayload {
  email: string;
  otp: string;
  expiresIn: number; // minutes
}

export interface OTPEmailTemplate {
  email: string;
  otp: string;
  expiresIn: number;
}
